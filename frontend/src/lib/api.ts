import type { AgentState, AgentMetrics, Task, GigDefinition, TaskType, TaskInput } from './types';

const API_BASE = '/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response.json();
}

// Wallet
export async function getBalance(): Promise<number> {
  const result = await fetchApi<{ balance: number }>('/wallet/balance');
  return result.data?.balance ?? 0;
}

export async function getTransactions(limit = 50): Promise<unknown[]> {
  const result = await fetchApi<unknown[]>(`/wallet/transactions?limit=${limit}`);
  return result.data ?? [];
}

// Agent
export async function getAgentState(): Promise<AgentState> {
  const result = await fetchApi<AgentState>('/agent/state');
  return result.data!;
}

export async function getAgentMetrics(): Promise<AgentMetrics> {
  const result = await fetchApi<AgentMetrics>('/agent/metrics');
  return result.data!;
}

export async function startAgent(): Promise<void> {
  await fetchApi('/agent/start', { method: 'POST' });
}

export async function pauseAgent(): Promise<void> {
  await fetchApi('/agent/pause', { method: 'POST' });
}

export async function resumeAgent(): Promise<void> {
  await fetchApi('/agent/resume', { method: 'POST' });
}

// Tasks
export async function getGigs(): Promise<GigDefinition[]> {
  const result = await fetchApi<GigDefinition[]>('/tasks/gigs');
  return result.data ?? [];
}

export async function getTasks(): Promise<Task[]> {
  const result = await fetchApi<Task[]>('/tasks');
  return result.data ?? [];
}

export async function getTask(id: string): Promise<Task | null> {
  const result = await fetchApi<Task>(`/tasks/${id}`);
  return result.data ?? null;
}

export async function createTask(type: TaskType, input: TaskInput): Promise<Task> {
  const result = await fetchApi<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ type, input }),
  });
  return result.data!;
}

export async function claimReward(taskId: string): Promise<{ success: boolean; amount: number }> {
  const result = await fetchApi<{ success: boolean; amount: number }>(`/tasks/${taskId}/claim`, {
    method: 'POST',
  });
  return result.data!;
}

// Event source for real-time updates
export function subscribeToEvents(
  onEvent: (event: string, data: unknown) => void
): EventSource {
  const eventSource = new EventSource(`${API_BASE}/events`);

  eventSource.addEventListener('balance_update', (e) => {
    onEvent('balance_update', JSON.parse(e.data));
  });

  eventSource.addEventListener('task_created', (e) => {
    onEvent('task_created', JSON.parse(e.data));
  });

  eventSource.addEventListener('task_started', (e) => {
    onEvent('task_started', JSON.parse(e.data));
  });

  eventSource.addEventListener('task_completed', (e) => {
    onEvent('task_completed', JSON.parse(e.data));
  });

  eventSource.addEventListener('task_failed', (e) => {
    onEvent('task_failed', JSON.parse(e.data));
  });

  eventSource.addEventListener('reward_claimed', (e) => {
    onEvent('reward_claimed', JSON.parse(e.data));
  });

  return eventSource;
}