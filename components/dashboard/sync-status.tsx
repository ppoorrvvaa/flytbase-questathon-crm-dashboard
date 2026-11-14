import type { McpEnvelope } from "@/lib/types"

const SOURCE_LABEL = { live: "Live", cache: "Saved", snapshot: "Snapshot" } as const

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function SyncStatus({ book, signals }: { book?: McpEnvelope<unknown>; signals?: McpEnvelope<unknown> }) {
  const items = [
    { label: "Accounts", env: book },
    { label: "Signals", env: signals },
  ]
  return (
    <dl className="flex items-center gap-4 text-xs">
      {items.map(({ label, env }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${env?.source === "live" ? "bg-emerald-500" : env ? "bg-amber-500" : "bg-muted-foreground/40"}`}
            aria-hidden="true"
          />
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums">
            {env ? `${SOURCE_LABEL[env.source]} · ${formatTime(env.fetchedAt)}` : "Loading"}
          </dd>
        </div>
      ))}
    </dl>
  )
}
