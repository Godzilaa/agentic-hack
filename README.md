# Freelance Agent 🤖💰

> **An AI agent that works gigs, pays for its own tools, and generates profit.**

A hackathon-ready demo showcasing the future of autonomous agent economics. Built with [Locus](https://paywithlocus.com) — the payment infrastructure for AI agents.

## The Hook

```
[12:01] Agent accepts task: "Find 5 potential customers for a SaaS product"
[12:02] Agent pays $0.003 for LinkedIn search API
[12:03] Agent pays $0.002 for company data enrichment  
[12:04] Agent pays $0.015 for OpenAI to draft personalized outreach
[12:05] Agent delivers results → Earns $5 reward
[12:06] Profit: $4.98
```

**The agent literally pays for itself.**

## Why This Wins Hackathons

| Factor | Why It Works |
|--------|--------------|
| **Visual Demo** | Real-time log showing money flowing in/out, profit counter ticking up |
| **Uses Sponsor Tech** | Perfect showcase of Locus's core value prop: "agents can pay" |
| **Solves Real Problem** | Companies pay for lead gen, research, data enrichment manually today |
| **Novel Concept** | Most agents COST money. This agent EARNS money. |
| **Memorable** | Judges remember "the agent that got a job" |

## Quick Start

### Prerequisites

1. **Locus API Key** — Get one at [app.paywithlocus.com](https://app.paywithlocus.com)
2. **USDC on Base** — Fund your Locus wallet ($5-10 for testing)
3. **Node.js 18+** — For running the backend

### Setup

```bash
# 1. Clone and setup backend
cd backend
cp .env.example .env
# Edit .env and add your LOCUS_API_KEY
npm install
npm run dev

# 2. Setup frontend (in new terminal)
cd frontend
npm install
npm run dev

# 3. Open dashboard
# Navigate to http://localhost:3000
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FREELANCE AGENT                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Task Queue  │ →  │  Job Engine │ →  │  Delivery   │  │
│  │ (Gigs)      │    │             │    │             │  │
│  └─────────────┘    └──────┬──────┘    └─────────────┘  │
│                            │                            │
│                            ▼                            │
│              ┌────────────────────────┐                │
│              │   LOCUS WALLET         │                │
│              │  Balance: $12.45       │                │
│              │  Spent today: $0.34    │                │
│              │  Earned today: $15.00 │                │
│              └────────────────────────┘                │
│                            │                            │
│         ┌──────────────────┼──────────────────┐        │
│         ▼                  ▼                  ▼        │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐    │
│   │ Brave    │      │ Anthropic│      │ Firecrawl│    │
│   │ Search   │      │ Claude   │      │ Scrape   │    │
│   └──────────┘      └──────────┘      └──────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Available Gigs

| Gig | Description | APIs Used | Est. Cost | Reward | Profit |
|-----|-------------|-----------|-----------|--------|--------|
| **Lead Generation** | Find potential customers | Brave + Firecrawl + Anthropic | $0.05 | $5.00 | $4.95 |
| **Competitor Research** | Analyze competitors | Perplexity + Firecrawl | $0.03 | $4.00 | $3.97 |
| **Content Summarization** | Summarize articles | Anthropic + Firecrawl | $0.02 | $3.00 | $2.98 |
| **Data Enrichment** | Enrich data with context | Exa + Anthropic | $0.04 | $4.50 | $4.46 |
| **Website Analysis** | Analyze websites | ScreenshotOne + Anthropic | $0.08 | $6.00 | $5.92 |

## Tech Stack

### Backend (`/backend`)
- **Node.js + Express** — REST API server
- **TypeScript** — Type safety
- **Locus SDK** — Payment & API orchestration

### Frontend (`/frontend`)
- **React + Vite** — Fast, modern UI
- **Tailwind CSS** — Styling
- **Server-Sent Events** — Real-time updates

## API Endpoints

### Wallet
- `GET /api/wallet/balance` — Current USDC balance
- `GET /api/wallet/transactions` — Transaction history

### Agent
- `GET /api/agent/state` — Status and stats
- `GET /api/agent/metrics` — Detailed metrics
- `POST /api/agent/start` — Start agent
- `POST /api/agent/pause` — Pause agent
- `POST /api/agent/resume` — Resume agent

### Tasks
- `GET /api/tasks/gigs` — Available gig types
- `GET /api/tasks` — List all tasks
- `POST /api/tasks` — Create new task
- `GET /api/tasks/:id` — Task details
- `POST /api/tasks/:id/claim` — Claim reward

### Real-time
- `GET /api/events` — SSE stream for live updates

## Demo Script (2 Minutes)

1. **Show the dashboard** — Balance, profit counter, task history
2. **Create a gig** — Pick "Lead Generation", enter a query
3. **Watch it work** — Real-time task progress, API calls logged
4. **Show profit** — Task completes, profit counter updates
5. **Repeat** — Run 2-3 tasks, show cumulative profit

## Extending

### Add a New Gig Type

1. Define in `backend/src/lib/types.ts`:
```typescript
export type TaskType = 
  | 'lead_generation'
  | 'competitor_research'
  | 'my_new_gig';  // Add here
```

2. Add gig definition in `backend/src/agents/task-executor.ts`:
```typescript
{
  type: 'my_new_gig',
  name: 'My New Gig',
  description: 'What it does',
  estimatedCost: 0.05,
  reward: 5.00,
  requiredApis: [
    { name: 'anthropic', category: 'ai', estimatedCost: 0.05, endpoint: '/wrapped/anthropic/messages' },
  ],
  estimatedTimeMs: 30000,
}
```

3. Implement the executor:
```typescript
private async executeMyNewGig(task: Task, gig: GigDefinition, totalCost: number): Promise<TaskOutput> {
  // Your implementation here
}
```

## Environment Variables

```env
# Locus API Configuration
LOCUS_API_KEY=claw_your_key_here
LOCUS_API_BASE=https://api.paywithlocus.com/api

# Server Configuration
PORT=3001
NODE_ENV=development

# Agent Configuration
AGENT_NAME=FreelanceAgent
MAX_CONCURRENT_TASKS=3
```

## License

MIT

## Credits

Built with [Locus](https://paywithlocus.com) — Payment infrastructure for AI agents. Backed by Y Combinator.

---

**The future of work isn't just AI doing tasks — it's AI getting hired.**