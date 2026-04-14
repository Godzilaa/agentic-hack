import express, { Request, Response } from 'express';
import cors from 'cors';
import { createLocusClient } from '../services/locus-client.js';
import { FreelanceAgent } from '../agents/agent.js';
import type { TaskInput, TaskType } from '../lib/types.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize agent
let agent: FreelanceAgent | null = null;

function getAgent(): FreelanceAgent {
  if (!agent) {
    const locusClient = createLocusClient();
    agent = new FreelanceAgent(locusClient);
  }
  return agent;
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Wallet endpoints
app.get('/api/wallet/balance', async (_req: Request, res: Response) => {
  try {
    const ag = getAgent();
    const balance = await ag.refreshBalance();
    res.json({ success: true, data: { balance, token: 'USDC', wallet_address: process.env.AGENT_WALLET_ADDRESS } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/wallet/transactions', async (req: Request, res: Response) => {
  try {
    const locusClient = createLocusClient();
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await locusClient.getTransactions(limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Agent endpoints
app.get('/api/agent/state', (_req: Request, res: Response) => {
  const ag = getAgent();
  res.json({ success: true, data: ag.getState() });
});

app.get('/api/agent/metrics', (_req: Request, res: Response) => {
  const ag = getAgent();
  res.json({ success: true, data: ag.getMetrics() });
});

app.post('/api/agent/start', async (_req: Request, res: Response) => {
  try {
    const ag = getAgent();
    await ag.start();
    res.json({ success: true, message: 'Agent started' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/agent/pause', (_req: Request, res: Response) => {
  const ag = getAgent();
  ag.pause();
  res.json({ success: true, message: 'Agent paused' });
});

app.post('/api/agent/resume', (_req: Request, res: Response) => {
  const ag = getAgent();
  ag.resume();
  res.json({ success: true, message: 'Agent resumed' });
});

// Task endpoints
app.get('/api/tasks/gigs', (_req: Request, res: Response) => {
  const ag = getAgent();
  res.json({ success: true, data: ag.getAvailableGigs() });
});

app.get('/api/tasks', (_req: Request, res: Response) => {
  const ag = getAgent();
  res.json({ success: true, data: ag.getAllTasks() });
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const ag = getAgent();
  const task = ag.getTask(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: task });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  try {
    const ag = getAgent();
    const { type, input } = req.body as { type: TaskType; input: TaskInput };

    if (!type || !input) {
      res.status(400).json({ success: false, error: 'type and input are required' });
      return;
    }

    const task = ag.createTask(type, input);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/tasks/:id/claim', async (req: Request, res: Response) => {
  try {
    const ag = getAgent();
    const result = await ag.claimReward(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Server-sent events for real-time updates
app.get('/api/events', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const ag = getAgent();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to agent events
  ag.on('balance_update', (balance: number) => sendEvent('balance_update', { balance }));
  ag.on('task_created', (task) => sendEvent('task_created', task));
  ag.on('task_started', (task) => sendEvent('task_started', task));
  ag.on('task_completed', (task) => sendEvent('task_completed', task));
  ag.on('task_failed', ({ task, error }) => sendEvent('task_failed', { task, error }));
  ag.on('reward_claimed', ({ taskId, amount }) => sendEvent('reward_claimed', { taskId, amount }));

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Freelance Agent API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

export default app;