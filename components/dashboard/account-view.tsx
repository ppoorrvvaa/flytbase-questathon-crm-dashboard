import { Badge } from "@/components/ui/badge"
import { BookWorthCard } from "@/components/dashboard/book-worth-card"
import { PowerMapCard } from "@/components/dashboard/power-map-card"
import { FirstMovesCard } from "@/components/dashboard/first-moves-card"
import { RisksCard } from "@/components/dashboard/risks-card"
import { UnknownsCard } from "@/components/dashboard/unknowns-card"
import {
  buildBookWorth,
  buildFirstMoves,
  buildPowerMap,
  buildRisks,
  buildUnknowns,
} from "@/lib/insights"
import type { Account, Signal } from "@/lib/types"

export function AccountView({ account, signals }: { account: Account; signals: Signal[] }) {
  const worth = buildBookWorth(account)
  const powerMap = buildPowerMap(account, signals)
  const moves = buildFirstMoves(account, signals)
  const risks = buildRisks(account, signals)
  const unknowns = buildUnknowns(account, signals)
  const critical = risks.filter((r) => r.severity === "critical").length

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby={`acct-${account.id}`} className="flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`acct-${account.id}`} className="text-xl font-semibold tracking-tight">
              {account.name}
            </h2>
            <Badge variant="secondary">Account {account.id}</Badge>
            {critical > 0 && <Badge variant="destructive">{critical} critical</Badge>}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Official story: </span>
            {account.official_story}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-sm md:text-right">
          <Stat label="Stakeholders" value={account.stakeholders.length} />
          <Stat label="Opportunities" value={account.opportunities.length} />
          <Stat label="Open risks" value={risks.length} />
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <BookWorthCard worth={worth} />
        <div className="lg:col-span-2">
          <FirstMovesCard moves={moves} accountId={account.id} />
        </div>
        <div className="lg:col-span-3">
          <PowerMapCard stakeholders={powerMap} />
        </div>
        <div className="lg:col-span-2">
          <RisksCard risks={risks} />
        </div>
        <UnknownsCard unknowns={unknowns} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
