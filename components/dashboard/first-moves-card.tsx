"use client"

import { useState } from "react"
import { ListChecks, Check, NotebookPen, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Move } from "@/lib/insights"

type LogState = { status: "idle" | "saving" | "saved" | "error"; message?: string }

export function FirstMovesCard({ moves, accountId }: { moves: Move[]; accountId: string }) {
  const [log, setLog] = useState<Record<string, LogState>>({})

  async function logMove(move: Move) {
    setLog((s) => ({ ...s, [move.id]: { status: "saving" } }))
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tool: "write_note",
          args: {
            account: accountId,
            kind: "next_step",
            title: move.title,
            text: `${move.detail}\nOwner: ${move.owner}. Due: ${move.due}.${move.unlocks ? ` Unlocks: ${move.unlocks}.` : ""}`,
          },
        }),
      })
      const json = await res.json()
      setLog((s) => ({ ...s, [move.id]: json.ok ? { status: "saved" } : { status: "error", message: json.error } }))
    } catch {
      setLog((s) => ({ ...s, [move.id]: { status: "error", message: "Network error" } }))
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ListChecks className="size-4" aria-hidden="true" />
          First Moves
        </CardTitle>
        <CardDescription>The three actions that matter most right now, in order.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {moves.map((m, i) => {
            const state = log[m.id] ?? { status: "idle" }
            return (
              <li key={m.id} className="flex gap-4 rounded-lg border p-4">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  aria-label={`Priority ${i + 1}`}
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h3 className="text-sm font-semibold leading-snug text-pretty">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{m.detail}</p>
                  <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <Meta label="Owner" value={m.owner} />
                    <Meta label="Due" value={m.due} />
                    {m.unlocks && <Meta label="Unlocks" value={m.unlocks} />}
                  </dl>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      size="sm"
                      variant={state.status === "saved" ? "secondary" : "outline"}
                      disabled={state.status === "saving" || state.status === "saved"}
                      onClick={() => logMove(m)}
                    >
                      {state.status === "saving" ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : state.status === "saved" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <NotebookPen aria-hidden="true" />
                      )}
                      {state.status === "saved" ? "Logged to CRM" : "Log as next step"}
                    </Button>
                    {state.status === "error" && (
                      <p className="text-xs text-destructive" role="alert">
                        {state.message}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
