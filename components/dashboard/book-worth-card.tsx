import { Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatEUR } from "@/lib/format"
import type { BookWorth } from "@/lib/insights"

const KIND_STYLE = {
  won: "bg-emerald-500",
  open: "bg-primary",
  pipeline: "bg-primary/40",
  declined: "bg-muted-foreground/30",
} as const

export function BookWorthCard({ worth }: { worth: BookWorth }) {
  const segments = [
    { key: "won", label: "Won", value: worth.won },
    { key: "open", label: "Open offers", value: worth.open },
    { key: "pipeline", label: "Pipeline", value: worth.pipeline },
  ] as const
  const max = Math.max(worth.total, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="size-4" aria-hidden="true" />
          Book Worth
        </CardTitle>
        <CardDescription className="sr-only">Total deal value across offers and opportunities</CardDescription>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatEUR(worth.total)}</p>
        <p className="text-xs text-muted-foreground">
          {formatEUR(worth.pipelineBlocked)} of pipeline blocked
          {worth.unsizedOpportunities > 0 && ` · ${worth.unsizedOpportunities} unsized`}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label="Book composition">
          {segments.map((s) => (
            <div key={s.key} className={KIND_STYLE[s.key]} style={{ width: `${(s.value / max) * 100}%` }} />
          ))}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-xs">
          {segments.map((s) => (
            <div key={s.key} className="flex flex-col gap-0.5">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className={`size-2 rounded-full ${KIND_STYLE[s.key]}`} aria-hidden="true" />
                {s.label}
              </dt>
              <dd className="font-medium tabular-nums">{formatEUR(s.value)}</dd>
            </div>
          ))}
        </dl>
        <Separator />
        <ul className="flex flex-col gap-2.5">
          {worth.lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="flex min-w-0 flex-col gap-1">
                <span className={l.kind === "declined" ? "text-muted-foreground line-through" : undefined}>{l.label}</span>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] capitalize">
                    {l.kind === "pipeline" ? l.stage : l.kind}
                  </Badge>
                  {l.blocked && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      Blocked
                    </Badge>
                  )}
                </div>
              </div>
              <span className="shrink-0 font-medium tabular-nums">{l.amount == null ? "—" : formatEUR(l.amount)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
