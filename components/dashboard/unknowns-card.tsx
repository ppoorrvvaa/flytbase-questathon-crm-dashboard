import { HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Unknown } from "@/lib/insights"

export function UnknownsCard({ unknowns }: { unknowns: Unknown[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <HelpCircle className="size-4" aria-hidden="true" />
          Unknowns
        </CardTitle>
        <CardDescription>Information gaps to close before anyone commits.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {unknowns.map((u) => (
            <li key={u.id} className="flex flex-col gap-1 rounded-lg border border-dashed p-3">
              <h3 className="text-sm font-medium leading-snug text-pretty">{u.question}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{u.why}</p>
              <p className="text-xs font-medium text-primary">{u.ask}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
