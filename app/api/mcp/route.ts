import { NextResponse, type NextRequest } from "next/server"
import { READ_TOOLS, readTool, writeNote, type ReadTool } from "@/lib/mcp-store"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") ?? "get_my_accounts"
  if (!READ_TOOLS.includes(tool as ReadTool)) {
    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 })
  }
  const refresh = req.nextUrl.searchParams.get("refresh") === "1"
  const envelope = await readTool(tool as ReadTool, { refresh })
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

  if ((account !== "A" && account !== "B") || !KINDS.has(kind) || !text || text.length > 4000) {
    return NextResponse.json({ ok: false, error: "Invalid note" }, { status: 400 })
  }

  const result = await writeNote({ account, kind, text, ...(title ? { title } : {}) })
  return NextResponse.json(result, { status: result.ok ? 200 : 429 })
}
