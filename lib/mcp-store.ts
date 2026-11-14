import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import os from "node:os"
import { callTool, McpRateLimitError } from "@/lib/mcp"
import type { McpEnvelope, Source } from "@/lib/types"
import accountsSnapshot from "@/data/accounts.json"
import signalsSnapshot from "@/data/signals.json"

// The MCP server allows one call a minute per token, so every answer is saved here
// and the dashboard reads from this store. Snapshots seed it on a cold start.
export const READ_TOOLS = ["get_my_accounts", "get_signals", "list_notes"] as const
export type ReadTool = (typeof READ_TOOLS)[number]

const CALL_INTERVAL_MS = 60_000
const STORE_FILE = path.join(os.tmpdir(), "cs-crm-mcp-store.json")

interface Entry {
  data: unknown
  fetchedAt: string
  source: Source
}

interface StoreState {
  entries: Partial<Record<string, Entry>>
  lastCallAt: number
  blockedUntil: number
}

const SNAPSHOT_TIME = new Date((accountsSnapshot as { exported_at: string }).exported_at).toISOString()

const globalStore = globalThis as unknown as { __mcpStore?: StoreState; __mcpStoreLoaded?: boolean }

function initialState(): StoreState {
  return {
    entries: {
      get_my_accounts: { data: accountsSnapshot, fetchedAt: SNAPSHOT_TIME, source: "snapshot" },
      get_signals: { data: signalsSnapshot, fetchedAt: SNAPSHOT_TIME, source: "snapshot" },
    },
    lastCallAt: 0,
    blockedUntil: 0,
  }
}

async function getState(): Promise<StoreState> {
  if (!globalStore.__mcpStore) globalStore.__mcpStore = initialState()
  if (!globalStore.__mcpStoreLoaded) {
    globalStore.__mcpStoreLoaded = true
    try {
      const saved = JSON.parse(await fs.readFile(STORE_FILE, "utf8")) as StoreState
      globalStore.__mcpStore = {
        entries: { ...globalStore.__mcpStore.entries, ...saved.entries },
        lastCallAt: saved.lastCallAt ?? 0,
        blockedUntil: saved.blockedUntil ?? 0,
      }
    } catch {
      // No saved store yet
    }
  }
  return globalStore.__mcpStore
}

async function persist(state: StoreState) {
  try {
    await fs.writeFile(STORE_FILE, JSON.stringify(state))
  } catch {
    // Read-only filesystem: keep the in-memory store only
  }
}

function secondsUntilNextCall(state: StoreState) {
  const nextAt = Math.max(state.lastCallAt + CALL_INTERVAL_MS, state.blockedUntil)
  return Math.max(0, Math.ceil((nextAt - Date.now()) / 1000))
}

let inflight: Promise<unknown> | null = null

async function spendCall<T>(state: StoreState, run: () => Promise<T>): Promise<T> {
  // Serialize calls so two requests never burn the same minute.
  while (inflight) await inflight.catch(() => undefined)
  const task = (async () => {
    state.lastCallAt = Date.now()
    try {
      return await run()
    } catch (err) {
      if (err instanceof McpRateLimitError) {
        state.blockedUntil = Date.now() + err.retryAfterSeconds * 1000
      }
      throw err
    } finally {
      await persist(state)
    }
  })()
  inflight = task
  try {
    return await task
  } finally {
    inflight = null
  }
}

export async function readTool<T>(tool: ReadTool, { refresh = false } = {}): Promise<McpEnvelope<T | null>> {
  const state = await getState()
  const cached = state.entries[tool]
  const wait = secondsUntilNextCall(state)

  const fromCache = (notice?: string): McpEnvelope<T | null> => ({
    tool,
    data: (cached?.data as T) ?? null,
    source: cached?.source === "live" ? "cache" : (cached?.source ?? "snapshot"),
    fetchedAt: cached?.fetchedAt ?? SNAPSHOT_TIME,
    nextCallInSeconds: secondsUntilNextCall(state),
    notice,
  })

  const shouldCall = (refresh || !cached || cached.source === "snapshot") && wait === 0 && process.env.AQ_TOKEN
  if (!shouldCall) {
    return fromCache(wait > 0 && refresh ? `Rate limit: next live call in ${wait}s. Showing saved data.` : undefined)
  }

  try {
    const data = await spendCall(state, () => callTool<T>(tool))
    const entry: Entry = { data, fetchedAt: new Date().toISOString(), source: "live" }
    state.entries[tool] = entry
    await persist(state)
    return { tool, data, source: "live", fetchedAt: entry.fetchedAt, nextCallInSeconds: secondsUntilNextCall(state) }
  } catch (err) {
    return fromCache(err instanceof Error ? err.message : "MCP call failed. Showing saved data.")
  }
}

export async function writeNote(args: { account: "A" | "B"; kind: string; text: string; title?: string }) {
  const state = await getState()
  const wait = secondsUntilNextCall(state)
  if (wait > 0) {
    return { ok: false as const, error: `Rate limit: try again in ${wait}s.`, nextCallInSeconds: wait }
  }
  try {
    const result = await spendCall(state, () => callTool("write_note", args))
    return { ok: true as const, result, nextCallInSeconds: secondsUntilNextCall(state) }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "write_note failed",
      nextCallInSeconds: secondsUntilNextCall(state),
    }
  }
}
