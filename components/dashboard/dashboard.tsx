"use client"

import useSWR from "swr"
import { useState } from "react"
import { Anchor, Building2, Factory, House, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountView } from "@/components/dashboard/account-view"
import { SyncStatus } from "@/components/dashboard/sync-status"
import type { Account, Book, McpEnvelope, Signals } from "@/lib/types"

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const SECTOR_RULES: { pattern: RegExp; label: string; icon: LucideIcon }[] = [
  { pattern: /police|constabulary|force/i, label: "Police", icon: ShieldCheck },
  { pattern: /industrial|manufactur|plant/i, label: "Industrial", icon: Factory },
  { pattern: /harbour|harbor|port/i, label: "Harbour", icon: Anchor },
  { pattern: /estate|residen|housing/i, label: "Estate", icon: House },
]

function tabFor(account: Account) {
  const sector = SECTOR_RULES.find((r) => r.pattern.test(account.name))
  const isNew = Boolean(account.released_at)
  const label = isNew
    ? account.name.split(" ")[0]
    : `Account ${account.id}${sector ? ` (${sector.label})` : ""}`
  return { id: account.id, label, icon: sector?.icon ?? Building2, isNew }
}

export function Dashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const book = useSWR<McpEnvelope<Book | null>>("/api/mcp?tool=get_my_accounts", fetcher, { revalidateOnFocus: false })
  const signals = useSWR<McpEnvelope<Signals | null>>("/api/mcp?tool=get_signals", fetcher, { revalidateOnFocus: false })

  async function refresh() {
    setRefreshing(true)
    setNotice(null)
    try {
      // One live MCP call a minute: refresh signals first (they change), then the book.
      const sig = await fetcher<McpEnvelope<Signals | null>>("/api/mcp?tool=get_signals&refresh=1")
      await signals.mutate(sig, { revalidate: false })
      if (sig.source !== "live") setNotice(sig.notice ?? null)
      else setNotice("Signals refreshed live. The account book refreshes on the next call window.")
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }

  const accounts = book.data?.data?.accounts ?? []
  const signalList = signals.data?.data?.signals ?? []

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              CS
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Customer Success Command</h1>
              <p className="text-xs text-muted-foreground">Book of business &middot; FlytBase accounts</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SyncStatus book={book.data} signals={signals.data} />
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden="true" />
              Refresh signals
            </Button>
          </div>
        </div>
        {notice && (
          <div className="mx-auto max-w-7xl px-4 pb-3 md:px-6" role="status">
            <p className="rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">{notice}</p>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {book.error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load accounts: {book.error.message}
          </p>
        ) : !book.data ? (
          <DashboardSkeleton />
        ) : (
          accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">The MCP server returned no accounts.</p>
          ) : (
            <Tabs defaultValue={accounts[0].id} className="gap-6">
              <div className="overflow-x-auto">
                <TabsList className="h-10">
                  {accounts.map((account) => {
                    const t = tabFor(account)
                    return (
                      <TabsTrigger key={t.id} value={t.id} className="gap-2 px-4">
                        <t.icon className="size-4" aria-hidden="true" />
                        {t.label}
                        {t.isNew && (
                          <Badge variant="secondary" className="h-5 bg-primary/10 px-1.5 text-[10px] text-primary">
                            New
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
              {accounts.map((account) => (
                <TabsContent key={account.id} value={account.id}>
                  <AccountView account={account} signals={signalList} />
                </TabsContent>
              ))}
            </Tabs>
          )
        )}
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading accounts">
      <div className="h-10 w-96 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
