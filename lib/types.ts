export type Relationship = "warm" | "neutral" | "guarded" | "cold" | string

export interface Stakeholder {
  id: string
  name: string
  role: string
  relationship: Relationship
  available: boolean
}

export interface Fact {
  id: string
  text: string
  said_by: string
  status: "claim" | "told" | "verified" | string
  verified_by?: string
  learned_at_minute: number
}

export interface Deadline {
  text: string
  soon?: boolean
  passed: boolean
  met?: boolean
  moves_left?: number | null
  minute?: number
}

export interface Opportunity {
  id: string
  title: string
  stage: string
  worth_up_to: number | null
  size: number | null
  blocker: { text: string; status: string } | null
  evidence: string[]
  deadline: Deadline | null
}

export interface Offer {
  id: string
  title: string
  value: number
  pitch_to: string
  status: "won" | "open" | "declined" | string
}

export interface Account {
  id: "A" | "B" | string
  name: string
  official_story: string
  stakeholders: Stakeholder[]
  facts: Fact[]
  opportunities: Opportunity[]
  offers: Offer[]
  deadlines: Deadline[]
  released_at?: string
}

export interface Book {
  format: string
  player: string
  exported_at: string
  minute: number
  world_closed: boolean
  accounts: Account[]
  files: { id: string; title: string; path: string; account: string }[]
}

export interface SignalRecord {
  kind: string
  path: string
  note?: string
  text: string
}

export interface Signal {
  id: string
  account: string
  dated: string
  title: string
  summary: string
  records: SignalRecord[]
  set_off_at: string
}

export interface Signals {
  signals: Signal[]
}

export type Source = "live" | "cache" | "snapshot"

export interface McpEnvelope<T> {
  tool: string
  data: T
  source: Source
  fetchedAt: string
  nextCallInSeconds: number
  notice?: string
}
