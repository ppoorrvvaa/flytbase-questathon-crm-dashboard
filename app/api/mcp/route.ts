import { NextResponse, type NextRequest } from "next/server"
import {
  ACCOUNT_IDS,
  NEW_ACCOUNT_IDS,
  READ_TOOLS,
  cachedNewAccounts,
  readTool,
  writeNote,
  type AccountId,
  type ReadTool,
} from "@/lib/mcp-store"
import type { Book } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") ?? "get_my_accounts"
  if (!READ_TOOLS.includes(tool as ReadTool)) {
    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 })
  }
  const refresh = req.nextUrl.searchParams.get("refresh") === "1"
  const account = req.nextUrl.searchParams.get("account") ?? undefined

  if (tool === "get_new_account") {
    if (!account || !(NEW_ACCOUNT_IDS as readonly string[]).includes(account)) {
      return NextResponse.json({ error: `Unknown new account: ${account}` }, { status: 400 })
    }
    const envelope = await readTool(tool, { refresh, account })
    return NextResponse.json(envelope, { headers: { "cache-control": "no-store" } })
  }

  const envelope = await readTool(tool as ReadTool, { refresh })

  if (tool === "get_my_accounts" && envelope.data) {
    // Fold newly released accounts into the book so the dashboard renders every account the MCP returned.
    const book = envelope.data as Book
    const known = new Set(book.accounts.map((a) => a.id))
    const extra = (await cachedNewAccounts<Book>()).flatMap((n) =>
      (n.data?.accounts ?? []).filter((a) => !known.has(a.id)).map((a) => ({ ...a, released_at: n.fetchedAt })),
    )
    envelope.data = { ...book, accounts: [...book.accounts, ...extra] }
  }

  return NextResponse.json(envelope, { headers: { "cache-control": "no-store" } })
}

const KINDS = new Set(["note", "task", "risk", "next_step"])

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
  const { tool, args } = (body ?? {}) as { tool?: string; args?: Record<string, unknown> }
  if (tool !== "write_note" || !args) {
    return NextResponse.json({ ok: false, error: "Only write_note is allowed" }, { status: 400 })
  }

  const account = args.account
  const kind = typeof args.kind === "string" ? args.kind : "note"
  const text = typeof args.text === "string" ? args.text.trim() : ""
  const title = typeof args.title === "string" ? args.title.trim().slice(0, 200) : undefined

  if (typeof account !== "string" || !ACCOUNT_IDS.includes(account) || !KINDS.has(kind) || !text || text.length > 4000) {
    return NextResponse.json({ ok: false, error: "Invalid note" }, { status: 400 })
  }

  const result = await writeNote({ account: account as AccountId, kind, text, ...(title ? { title } : {}) })
  return NextResponse.json(result, { status: result.ok ? 200 : 429 })
}
