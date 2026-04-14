// Core types for the Freelance Agent

export interface LocusConfig {
  apiKey: string;
  apiBase: string;
}

export interface WalletBalance {
  usdc_balance: string;
  wallet_address: string;
  chain: string;
  allowance: string | null;
  max_transaction_size: string | null;
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

// Task types
export type TaskType =
  | 'lead_generation'
  | 'competitor_research'
  | 'content_summarization'
  | 'data_enrichment'
  | 'website_analysis';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_approval'
  | 'completed'
  | 'failed';

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  input: TaskInput;
  output?: TaskOutput;
  costUsd: number;
  rewardUsd: number;
  profitUsd: number;
  createdAt: Date;
  completedAt?: Date;
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

// Agent types
export interface AgentState {
  status: 'idle' | 'working' | 'paused' | 'error';
  currentTaskId?: string;
  walletBalance: number;
  totalEarned: number;
  totalSpent: number;
  tasksCompleted: number;
  tasksFailed: number;
  lastActivity?: Date;
}

// API Provider types
export interface ApiProvider {
  name: string;
  category: string;
  estimatedCost: number;
  endpoint: string;
}

// Task definition for available gigs
export interface GigDefinition {
  type: TaskType;
  name: string;
  description: string;
  estimatedCost: number;
  reward: number;
  requiredApis: ApiProvider[];
  estimatedTimeMs: number;
}

// Metrics
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