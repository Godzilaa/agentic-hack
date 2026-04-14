// Frontend types matching backend

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskType =
  | 'lead_generation'
  | 'competitor_research'
  | 'content_summarization'
  | 'data_enrichment'
  | 'website_analysis';

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  input: TaskInput;
  output?: TaskOutput;
  costUsd: number;
  rewardUsd: number;
  profitUsd: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface TaskInput {
  query: string;
  context?: string;
  targetCount?: number;
  filters?: Record<string, string>;
}

export interface TaskOutput {
  result: unknown;
  summary: string;
  artifacts?: string[];
}

export interface AgentState {
  status: 'idle' | 'working' | 'paused' | 'error';
  currentTaskId?: string;
  walletBalance: number;
  totalEarned: number;
  totalSpent: number;
  tasksCompleted: number;
  tasksFailed: number;
  lastActivity?: string;
}

export interface AgentMetrics {
  uptime: number;
  totalProfit: number;
  totalRevenue: number;
  totalCosts: number;
  taskSuccessRate: number;
  avgTaskDuration: number;
  profitPerTask: number;
  recentTasks: Task[];
}

export interface GigDefinition {
  type: TaskType;
  name: string;
  description: string;
  estimatedCost: number;
  reward: number;
  requiredApis: ApiProvider[];
  estimatedTimeMs: number;
}

export interface ApiProvider {
  name: string;
  category: string;
  estimatedCost: number;
  endpoint: string;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  token: string;
  status: TransactionStatus;
  memo?: string;
  created_at: string;
  category?: string;
  provider?: string;
}

export type TransactionStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'POLICY_REJECTED'
  | 'VALIDATION_FAILED'
  | 'CANCELLED'
  | 'EXPIRED';