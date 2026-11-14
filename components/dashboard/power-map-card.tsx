import { Gavel, Banknote, Users, Ban, Network } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { initials } from "@/lib/format"
import type { MappedStakeholder, PowerRole } from "@/lib/insights"

const COLUMNS: { role: PowerRole; icon: typeof Gavel; hint: string }[] = [
  { role: "Decides", icon: Gavel, hint: "Owns the yes/no" },
  { role: "Pays", icon: Banknote, hint: "Controls the budget" },
  { role: "Uses", icon: Users, hint: "Lives with the product" },
  { role: "Blocks", icon: Ban, hint: "Can stop it" },
]

const REL_STYLE: Record<string, string> = {
  warm: "bg-emerald-50 text-emerald-700 border-emerald-200",
  neutral: "bg-muted text-muted-foreground border-border",
  guarded: "bg-amber-50 text-amber-800 border-amber-200",
  cold: "bg-red-50 text-red-700 border-red-200",
}

export function PowerMapCard({ stakeholders }: { stakeholders: MappedStakeholder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Network className="size-4" aria-hidden="true" />
          Power Map
        </CardTitle>
        <CardDescription>Who decides, who pays, who uses it, and who can block it.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const people = stakeholders.filter((s) => s.powerRole === col.role)
            return (
              <section key={col.role} aria-label={col.role} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <col.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">{col.role}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{col.hint}</span>
                </header>
                {people.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    Nobody mapped. Gap.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {people.map((p) => (
                      <li key={p.id} className="flex gap-3 rounded-md border bg-card p-2.5">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
                          aria-hidden="true"
                        >
                          {initials(p.name)}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs leading-snug text-muted-foreground">{p.role}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] capitalize ${REL_STYLE[p.relationship] ?? ""}`}>
                              {p.relationship}
                            </Badge>
                            {p.flags.map((f) => (
                              <Badge
                                key={f}
                                variant={f === "Leaving in January" || f === "Unavailable" ? "destructive" : "secondary"}
                                className="h-5 px-1.5 text-[10px]"
                              >
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
