import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Risk, Severity } from "@/lib/insights"

const SEVERITY: Record<Severity, { label: string; bar: string; badge: string }> = {
  critical: { label: "Critical", bar: "bg-red-600", badge: "bg-red-50 text-red-700 border-red-200" },
  high: { label: "High", bar: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  medium: { label: "Medium", bar: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground border-border" },
}

export function RisksCard({ risks }: { risks: Risk[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {"What's About to Go Wrong"}
        </CardTitle>
        <CardDescription>Risks and deadlines, most urgent first.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y rounded-lg border">
          {risks.map((r) => {
            const sev = SEVERITY[r.severity]
            return (
              <li key={r.id} className="flex gap-3 p-3">
                <span className={`w-1 shrink-0 rounded-full ${sev.bar}`} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${sev.badge}`}>
                      {sev.label}
                    </Badge>
                    <h3 className="text-sm font-medium">{r.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{r.when}</span> &middot; {r.source}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
