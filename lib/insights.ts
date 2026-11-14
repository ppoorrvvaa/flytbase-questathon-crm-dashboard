import type { Account, Fact, Signal, Stakeholder } from "@/lib/types"

export type PowerRole = "Decides" | "Pays" | "Uses" | "Blocks"
export type Severity = "critical" | "high" | "medium"

export interface MappedStakeholder extends Stakeholder {
  powerRole: PowerRole
  flags: string[]
  voiceCount: number
}

export interface BookWorth {
  won: number
  open: number
  declined: number
  pipeline: number
  pipelineBlocked: number
  unsizedOpportunities: number
  total: number
  lines: { id: string; label: string; amount: number | null; kind: "won" | "open" | "declined" | "pipeline"; blocked: boolean; stage?: string }[]
}

export interface Move {
  id: string
  title: string
  detail: string
  owner: string
  due: string
  unlocks?: string
}

export interface Risk {
  id: string
  title: string
  detail: string
  severity: Severity
  when: string
  source: string
}

export interface Unknown {
  id: string
  question: string
  why: string
  ask: string
}

const ROLE_RULES: { role: PowerRole; pattern: RegExp }[] = [
  { role: "Blocks", pattern: /data protection|privacy|it infrastructure|network|security officer|legal|compliance/i },
  { role: "Pays", pattern: /finance|procurement|budget|controller|cfo/i },
  { role: "Decides", pattern: /programme lead|head of|director|chief|lead$/i },
  { role: "Uses", pattern: /inspector|plant manager|operator|unit|pilot|manager/i },
]

export function classifyRole(role: string): PowerRole {
  return ROLE_RULES.find((r) => r.pattern.test(role))?.role ?? "Uses"
}

export function signalsFor(account: Account, signals: Signal[]) {
  return signals.filter((s) => s.account === account.id).sort((a, b) => a.dated.localeCompare(b.dated))
}

export function buildPowerMap(account: Account, signals: Signal[]): MappedStakeholder[] {
  const accountSignals = signalsFor(account, signals)
  return account.stakeholders.map((s) => {
    const voiceCount = account.facts.filter((f) => f.said_by === s.name).length
    const flags: string[] = []
    if (!s.available) flags.push("Unavailable")
    if (voiceCount === 0) flags.push("Never spoken to")
    for (const sig of accountSignals) {
      const lastName = s.name.split(" ").at(-1) ?? s.name
      if (sig.id === "champion_leaves" && sig.summary.includes(lastName)) flags.push("Leaving in January")
      if (sig.id === "urgent_request" && sig.summary.includes(lastName)) flags.push("Waiting on reply")
    }
    return { ...s, powerRole: classifyRole(s.role), flags, voiceCount }
  })
}

export function buildBookWorth(account: Account): BookWorth {
  const lines: BookWorth["lines"] = []
  let won = 0
  let open = 0
  let declined = 0
  let pipeline = 0
  let pipelineBlocked = 0
  let unsized = 0

  for (const o of account.offers) {
    const kind = o.status === "won" ? "won" : o.status === "declined" ? "declined" : "open"
    if (kind === "won") won += o.value
    else if (kind === "declined") declined += o.value
    else open += o.value
    lines.push({ id: o.id, label: o.title, amount: o.value, kind, blocked: false })
  }
  for (const opp of account.opportunities) {
    const blocked = opp.blocker?.status === "open"
    if (opp.worth_up_to == null) unsized++
    else {
      pipeline += opp.worth_up_to
      if (blocked) pipelineBlocked += opp.worth_up_to
    }
    lines.push({ id: opp.id, label: opp.title, amount: opp.worth_up_to, kind: "pipeline", blocked, stage: opp.stage })
  }

  return { won, open, declined, pipeline, pipelineBlocked, unsizedOpportunities: unsized, total: won + open + pipeline, lines }
}

function parseCsv(text: string) {
  const [header, ...rows] = text.trim().split("\n")
  const cols = header.split(",")
  return rows.map((row) => Object.fromEntries(row.split(",").map((v, i) => [cols[i], v])))
}

export function stoppedDocks(signals: Signal[]) {
  const usage = signals.flatMap((s) => s.records).find((r) => r.kind === "usage")
  if (!usage) return []
  const rows = parseCsv(usage.text)
  const weeks = [...new Set(rows.map((r) => r.week_start))].sort()
  const recent = new Set(weeks.slice(-2))
  const byDock = new Map<string, { early: number; late: number }>()
  for (const r of rows) {
    const d = byDock.get(r.dock_id) ?? { early: 0, late: 0 }
    if (recent.has(r.week_start)) d.late += Number(r.flights)
    else d.early += Number(r.flights)
    byDock.set(r.dock_id, d)
  }
  return [...byDock.entries()]
    .filter(([, d]) => d.early >= 8 && d.late === 0)
    .map(([dock, d]) => ({ dock, earlierFlights: d.early }))
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

export function buildFirstMoves(account: Account, signals: Signal[]): Move[] {
  const sigs = signalsFor(account, signals)
  const has = (id: string) => sigs.some((s) => s.id === id)
  const opp = (id: string) => account.opportunities.find((o) => o.id === id)
  const moves: Move[] = []

  if (account.id === "A") {
    if (has("urgent_request")) {
      moves.push({
        id: "a_reply_karen",
        title: "Answer Karen Mbeki's ticket FB-11206 in writing this week",
        detail:
          "Confirm how many more Westmere officers can be trained before 5 December and when, plus a named on-call contact and response time if a dock fails on the day. She is the warmest user on the account and nobody has replied.",
        owner: "CSM + Support lead",
        due: "This week (before 5 Dec event)",
        unlocks: "Protects the Westmere relationship and the renewal evidence",
      })
    }
    const tarn = opp("a_tarn")
    if (tarn?.blocker?.status === "open") {
      moves.push({
        id: "a_dataflow_pack",
        title: "Ship the data-flow pack to Fatima Osei and own the follow-up",
        detail:
          "Engineering can produce flows, retention, video storage location and access controls in a week. CSM sends it, chases it and answers the DPO. Her DPIA closes three weeks later and Norwold copies it.",
        owner: "CSM (engineering builds)",
        due: "Pack in 1 week, DPIA in ~4 weeks",
        unlocks: tarn.worth_up_to ? `${fmtMoney(tarn.worth_up_to)} — Tarn Valley and Norwold go live` : undefined,
      })
    }
    if (has("champion_leaves")) {
      moves.push({
        id: "a_multithread",
        title: "Multi-thread before Rhys Calder hands over in January",
        detail:
          "Ask Rhys for a joint handover meeting with his successor, and open direct lines to Hannah Doyle (procurement) and Ewan Brooks (finance). Get a costed operating model in front of them before the tender specification locks.",
        owner: "CSM + Account executive",
        due: "Before January handover",
        unlocks: "Keeps the renewal and 300-dock tender from going dark",
      })
    }
  }

  if (account.id === "B") {
    const docks = stoppedDocks(sigs)
    if (docks.length) {
      moves.push({
        id: "b_stopped_docks",
        title: `Find out why ${docks.map((d) => d.dock).join(", ")} stopped flying`,
        detail:
          "Three docks that flew most nights flew nothing for two weeks while staying online. No ticket, no word from the customer. Call the plant managers this week, starting with Beatriz Alonso, before it shows up in the renewal.",
        owner: "CSM",
        due: "This week",
        unlocks: "Protects the 4 plants that actually fly — the real ROI story",
      })
    }
    const idle = opp("b_idle")
    if (idle?.blocker?.status === "open") {
      moves.push({
        id: "b_network_pilot",
        title: "Take Owen Fitch's offer: 2 engineer-days for a network pilot plan",
        detail:
          "Ask with specifics: dock list, bandwidth needs, and segmentation exceptions for Plants 11-14. The segmentation project starts in four months and will cut dock connectivity unless exceptions are planned now.",
        owner: "CSM + Solutions engineer",
        due: "Request this week, plan in 30 days",
        unlocks: idle.worth_up_to ? `${fmtMoney(idle.worth_up_to)} — idle plants into regular patrol` : undefined,
      })
    }
    moves.push({
      id: "b_reset_story",
      title: "Reset the ROI story with plant-level flight logs before the case study",
      detail:
        "The official line is 13 of 15 plants flying and €1.2M saved. The flight log says 4 fly regularly. Bring the real numbers to Nadia Rahman privately and agree a credible baseline before anything goes to the 40-plant sister company.",
      owner: "CSM + Finance sponsor",
      due: "Before case study drafting",
      unlocks: "Credibility with finance and the sister-company opportunity",
    })
  }

  for (const o of account.opportunities) {
    if (moves.length >= 3) break
    if (o.blocker?.status === "open" && !moves.some((m) => m.unlocks?.includes(o.title))) {
      moves.push({ id: `unblock_${o.id}`, title: `Unblock: ${o.title}`, detail: o.blocker.text, owner: "CSM", due: "Next 2 weeks" })
    }
  }
  return moves.slice(0, 3)
}

export function buildRisks(account: Account, signals: Signal[]): Risk[] {
  const risks: Risk[] = []
  for (const s of signalsFor(account, signals)) {
    const severity: Severity = s.id === "urgent_request" || s.id === "usage_drop" ? "critical" : "high"
    risks.push({ id: s.id, title: s.title.replace(/^[^:]+:\s*/, ""), detail: s.summary, severity, when: s.dated, source: "Live signal" })
  }
  for (const d of account.deadlines.filter((d) => !d.passed)) {
    risks.push({
      id: `deadline_${d.text.slice(0, 16)}`,
      title: "Tender specification locks",
      detail: `${d.text} No costed operating model exists and nobody has agreed who would fly 300 docks.`,
      severity: d.soon ? "critical" : "high",
      when: d.soon ? "Soon" : "Date not confirmed",
      source: "Deadline",
    })
  }
  for (const o of account.opportunities) {
    if (o.blocker?.status === "open") {
      risks.push({
        id: `blocker_${o.id}`,
        title: o.title,
        detail: o.blocker.text,
        severity: (o.worth_up_to ?? 0) >= 200000 ? "high" : "medium",
        when: o.worth_up_to ? `${fmtMoney(o.worth_up_to)} at stake` : "Unsized",
        source: "Blocker",
      })
    }
  }
  for (const f of account.facts) {
    if (/four months|segmentation|cut the docks|no funding|never answered/i.test(f.text) && !risks.some((r) => r.detail.includes(f.text))) {
      risks.push({ id: `fact_${f.id}`, title: `Flagged by ${f.said_by}`, detail: f.text, severity: "medium", when: f.status === "verified" ? "Verified" : "Reported", source: "Discovery" })
    }
  }
  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2 }
  return risks.sort((a, b) => order[a.severity] - order[b.severity])
}

export function buildUnknowns(account: Account, signals: Signal[]): Unknown[] {
  const unknowns: Unknown[] = []
  const claims = account.facts.filter((f: Fact) => f.status === "claim")
  for (const c of claims) {
    const contradicted = account.facts.find((f) => f.id !== c.id && f.id.split("_").slice(0, 2).join("_") === c.id.split("_").slice(0, 2).join("_") && f.status !== "claim")
    unknowns.push({
      id: `claim_${c.id}`,
      question: `Is it true? "${c.text}"`,
      why: contradicted ? `Unverified claim from ${c.said_by}. Later evidence says: ${contradicted.text}` : `Unverified claim from ${c.said_by}.`,
      ask: "Verify against flight logs or a second stakeholder",
    })
  }
  for (const o of account.opportunities.filter((o) => o.worth_up_to == null)) {
    unknowns.push({ id: `size_${o.id}`, question: `What is "${o.title}" worth?`, why: `Stage: ${o.stage}. No value or size on file.`, ask: "Size it with the economic buyer" })
  }
  for (const s of account.stakeholders) {
    if (!account.facts.some((f) => f.said_by === s.name)) {
      unknowns.push({ id: `silent_${s.id}`, question: `Where does ${s.name} stand?`, why: `${s.role}. Relationship is ${s.relationship}, but nothing on file from them directly.`, ask: "Book a first conversation" })
    }
  }
  if (signalsFor(account, signals).some((s) => s.id === "champion_leaves")) {
    unknowns.push({ id: "successor", question: "Who replaces Rhys Calder?", why: "No successor named. Every call on file was with him alone.", ask: "Ask Rhys directly for the name and a joint intro" })
  }
  for (const d of account.deadlines.filter((d) => !d.passed)) {
    unknowns.push({ id: `date_${d.text.slice(0, 10)}`, question: "When exactly does the tender spec lock?", why: d.text, ask: "Confirm the date with Hannah Doyle (procurement)" })
  }
  return unknowns
}
