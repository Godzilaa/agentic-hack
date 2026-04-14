---
name: freelance-agent
description: An autonomous AI agent that earns money by completing gigs. Uses Locus APIs to pay for tools, completes tasks, and generates profit. Demonstrates agent economics - the agent pays for its own APIs and earns rewards.
allowed-tools: Bash WebFetch
---

# Freelance Agent — AI That Earns Money

A hackathon-ready demo of an AI agent that works gigs, pays for its own tools, and generates profit.

## What This Agent Does

1. **Claims Tasks** — Pulls from a task board of paid gigs (lead generation, research, etc.)
2. **Shops for Tools** — Pays Locus APIs as needed (Brave Search, Firecrawl, Anthropic, etc.)
3. **Delivers Results** — Completes task, submits, earns reward
4. **Tracks Profit** — Real-time P&L dashboard shows money in/out

## Core Concept

Most AI agents **cost** money. This one **earns** money. It demonstrates the future of autonomous agent economics.

## Prerequisites

1. **Locus API Key** — Get one at https://app.paywithlocus.com
2. **USDC on Base** — Fund your Locus wallet (test with $5-10)
3. **Node.js 18+** — For running the backend

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your LOCUS_API_KEY
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Open Dashboard

Navigate to http://localhost:3000

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
│              │  Spent: $0.34          │                │
│              │  Earned: $15.00        │                │
│              └────────────────────────┘                │
│                            │                            │
│         ┌──────────────────┼──────────────────┐        │
│         ▼                  ▼                  ▼        │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐    │
│   │ Brave    │      │ Anthropic│      │ Firecrawl│    │
│   │ Search   │      │ (AI)     │      │ (Scrape) │    │
│   └──────────┘      └──────────┘      └──────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Available Gigs

| Gig | APIs Used (via Locus) | Est. Cost | Reward | Profit |
|-----|----------------------|-----------|--------|--------|
| Lead Generation | Brave Search + Firecrawl + Anthropic | ~$0.05 | $5.00 | $4.95 |
| Competitor Research | Perplexity + Firecrawl | ~$0.03 | $4.00 | $3.97 |
| Content Summarization | Anthropic + Firecrawl | ~$0.02 | $3.00 | $2.98 |
| Data Enrichment | Exa + Anthropic | ~$0.04 | $4.50 | $4.46 |
| Website Analysis | ScreenshotOne + Anthropic + Firecrawl | ~$0.08 | $6.00 | $5.92 |

## API Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/balance` | GET | Current USDC balance |
| `/api/wallet/transactions` | GET | Transaction history |
| `/api/agent/state` | GET | Agent status and stats |
| `/api/agent/start` | POST | Start the agent |
| `/api/agent/pause` | POST | Pause the agent |
| `/api/agent/resume` | POST | Resume the agent |
| `/api/tasks/gigs` | GET | Available gig types |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create a new task |
| `/api/tasks/:id` | GET | Get task details |
| `/api/tasks/:id/claim` | POST | Claim reward for completed task |
| `/api/events` | SSE | Real-time updates |

## Demo Script (2 minutes)

1. **Show the dashboard** — Balance, profit counter, task history
2. **Create a gig** — Pick "Lead Generation", enter a query
3. **Watch it work** — Real-time task progress, API calls logged
4. **Show profit** — Task completes, profit counter updates
5. **Repeat** — Run 2-3 more tasks, show cumulative profit

## Hackathon Tips

- **Live API calls** — Judges love seeing real API responses
- **Profit counter** — The "earning money" angle is memorable
- **Multiple gigs** — Show variety in task types
- **Error handling** — Show how it handles failures gracefully
- **Real-time updates** — SSE makes it feel dynamic

## Customization Ideas

1. **Add more gig types** — Create new task types in `backend/src/agents/task-executor.ts`
2. **Connect external bounties** — Integrate with real bounty platforms
3. **Add email notifications** — Use AgentMail to notify on task completion
4. **Hire freelancers** — Use Locus Hire to outsource tasks the agent can't do
5. **Multi-agent** — Run multiple specialized agents in parallel