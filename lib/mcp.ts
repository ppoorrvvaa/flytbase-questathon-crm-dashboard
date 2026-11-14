import "server-only"

// Runs on the dashboard's server (API route). The token lives in an env var, never in browser code.
const MCP = "https://questathon.aihackerscollective.com/api/public/mcp"

export class McpRateLimitError extends Error {
  retryAfterSeconds: number
  constructor(message: string, retryAfterSeconds: number) {
    super(message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(MCP, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${process.env.AQ_TOKEN}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
    cache: "no-store",
  })
  const { result, error } = await res.json()
  if (error || result.isError) {
    const message: string = error?.message ?? result.content[0].text
    const retry = parseRetryAfter(message)
    if (retry !== null) throw new McpRateLimitError(message, retry)
    throw new Error(message)
  }
  return JSON.parse(result.content[0].text) as T
}

function parseRetryAfter(message: string): number | null {
  try {
    const parsed = JSON.parse(message)
    if (typeof parsed?.retry_after_seconds === "number") return parsed.retry_after_seconds
  } catch {
    // Plain-text error message
  }
  const match = /try again in (\d+) seconds/i.exec(message)
  return match ? Number(match[1]) : null
}
