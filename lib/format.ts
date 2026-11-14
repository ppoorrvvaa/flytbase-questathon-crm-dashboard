const eur = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
const eurCompact = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatEUR(n: number) {
  return Math.abs(n) >= 1_000_000 ? eurCompact.format(n) : eur.format(n)
}

export function initials(name: string) {
  return name
    .replace(/^(Insp\.|Dr\.|Mr\.|Ms\.)\s*/i, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
