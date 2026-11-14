# FlytBase Questathon CRM Dashboard

A live Customer Success Command dashboard built for the FlytBase Questathon. It pulls real-time data via an MCP (Model Context Protocol) server to manage two enterprise accounts (Eastern Counties Police Alliance and Aldermoor Industrial Group).

## Features
- **Book Worth:** Traces every pipeline value to a specific deal.
- **Power Map:** Maps stakeholders into Decides, Pays, Uses, and Blocks.
- **First Moves:** Ranks the top 3 urgent tasks with owners and dates.
- **Live Risks:** Automatically surfaces live signals (e.g., key contact departures, stalled deployments).
- **Unknowns:** Flags unverified claims that need immediate follow-up.

## How to Run Locally
1. Clone this repository.
2. Run `npm install` (or `pnpm install`).
3. Create a `.env.local` file in the root directory.
4. Add your MCP token: `AQ_TOKEN=your_secret_token_here`
5. Run `npm run dev` and open `http://localhost:3000`.

## Tech Stack
- Next.js (App Router)
- Tailwind CSS
- MCP (Model Context Protocol) for live data fetching
