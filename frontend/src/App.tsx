import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Activity,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import type { AgentState, AgentMetrics, Task, GigDefinition, TaskType } from './lib/types';
import {
  getAgentState,
  getAgentMetrics,
  getGigs,
  getTasks,
  createTask,
  startAgent,
  pauseAgent,
  resumeAgent,
  subscribeToEvents,
} from './lib/api';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

// Format relative time
const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Status badge component
const StatusBadge: React.FC<{ status: AgentState['status'] }> = ({ status }) => {
  const colors = {
    idle: 'bg-gray-600',
    working: 'bg-yellow-500 animate-pulse',
    paused: 'bg-orange-500',
    error: 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      <span className={`w-2 h-2 rounded-full ${colors[status]}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Task status badge
const TaskStatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
  const config = {
    pending: { color: 'bg-gray-500', icon: Clock },
    in_progress: { color: 'bg-yellow-500', icon: Activity },
    completed: { color: 'bg-green-500', icon: CheckCircle },
    failed: { color: 'bg-red-500', icon: XCircle },
  };

  const { color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      <Icon size={12} />
      {status.replace('_', ' ')}
    </span>
  );
};

// Profit display with animation
const ProfitDisplay: React.FC<{ profit: number; label: string }> = ({ profit, label }) => {
  const isPositive = profit >= 0;

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`text-2xl font-bold profit-counter ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{formatCurrency(profit)}
      </div>
    </div>
  );
};

// Task card component
const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const statusClasses = {
    pending: 'task-pending',
    in_progress: 'task-in_progress',
    completed: 'task-completed',
    failed: 'task-failed',
  };

  return (
    <div className={`task-card ${statusClasses[task.status]}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-white">{task.type.replace('_', ' ')}</h3>
          <p className="text-sm text-gray-400">{task.input.query}</p>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-500">Cost:</span>{' '}
          <span className="text-red-400">${task.costUsd.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-gray-500">Reward:</span>{' '}
          <span className="text-green-400">${task.rewardUsd.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">Profit:</span>{' '}
          <span className={task.profitUsd >= 0 ? 'text-green-400' : 'text-red-400'}>
            ${task.profitUsd.toFixed(2)}
          </span>
        </div>
      </div>

      {task.output?.summary && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-gray-300">{task.output.summary}</p>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {formatRelativeTime(task.createdAt)}
      </div>
    </div>
  );
};

// Gig selection component
const GigSelector: React.FC<{
  gigs: GigDefinition[];
  onSelect: (type: TaskType, input: Task['input']) => void;
}> = ({ gigs, onSelect }) => {
  const [selectedGig, setSelectedGig] = useState<GigDefinition | null>(null);
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGig && query.trim()) {
      onSelect(selectedGig.type, { query: query.trim() });
      setSelectedGig(null);
      setQuery('');
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap size={20} className="text-locus-400" />
        New Gig
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {gigs.map((gig) => (
          <button
            key={gig.type}
            onClick={() => setSelectedGig(gig)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedGig?.type === gig.type
                ? 'border-locus-500 bg-locus-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-medium text-sm">{gig.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              Cost: ${gig.estimatedCost.toFixed(2)} → ${gig.reward.toFixed(2)}
            </div>
          </button>
        ))}
      </div>

      {selectedGig && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {selectedGig.description}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-locus-500"
            />
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Est. profit: ${(selectedGig.reward - selectedGig.estimatedCost).toFixed(2)}</span>
            <span>Time: ~{Math.ceil(selectedGig.estimatedTimeMs / 1000)}s</span>
          </div>

          <button type="submit" className="btn-primary w-full">
            Create Task
          </button>
        </form>
      )}
    </div>
  );
};

// Main App
function App() {
  const [state, setState] = useState<AgentState | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [gigs, setGigs] = useState<GigDefinition[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [agentState, agentMetrics, gigList, taskList] = await Promise.all([
        getAgentState(),
        getAgentMetrics(),
        getGigs(),
        getTasks(),
      ]);
      setState(agentState);
      setMetrics(agentMetrics);
      setGigs(gigList);
      setTasks(taskList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    fetchData();

    const eventSource = subscribeToEvents((event, data) => {
      switch (event) {
        case 'balance_update':
          setState((prev) => prev ? { ...prev, walletBalance: (data as { balance: number }).balance } : null);
          break;
        case 'task_created':
          setTasks((prev) => [...prev, data as Task]);
          break;
        case 'task_completed':
        case 'task_failed':
          const completedTask = data as Task;
          setTasks((prev) =>
            prev.map((t) => (t.id === completedTask.id ? completedTask : t))
          );
          fetchData(); // Refresh metrics
          break;
      }
    });

    return () => eventSource.close();
  }, [fetchData]);

  const handleCreateTask = async (type: TaskType, input: Task['input']) => {
    try {
      await createTask(type, input);
      await fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStartStop = async () => {
    try {
      if (state?.status === 'paused') {
        await resumeAgent();
      } else if (state?.status === 'idle' || state?.status === 'working') {
        await pauseAgent();
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    }
  };

  const handleStart = async () => {
    try {
      await startAgent();
      await fetchData();
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-locus-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-locus-500 flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Freelance Agent</h1>
              <p className="text-xs text-gray-400">AI that earns money</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {state && <StatusBadge status={state.status} />}
            <button
              onClick={handleStartStop}
              className={`btn-secondary flex items-center gap-2 ${state?.status === 'working' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              {state?.status === 'working' ? (
                <>
                  <Pause size={16} />
                  Pause
                </>
              ) : state?.status === 'paused' ? (
                <>
                  <Play size={16} />
                  Resume
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start
                </>
              )}
            </button>
            <button onClick={fetchData} className="btn-secondary">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Wallet balance */}
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Wallet size={16} />
              <span className="text-sm">Balance</span>
            </div>
            <div className="text-2xl font-bold profit-counter">
              ${state?.walletBalance.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Total earned */}
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Earned</span>
            </div>
            <div className="text-2xl font-bold text-green-400 profit-counter">
              +${state?.totalEarned.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Total spent */}
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingDown size={16} />
              <span className="text-sm">Spent</span>
            </div>
            <div className="text-2xl font-bold text-red-400 profit-counter">
              -${state?.totalSpent.toFixed(4) || '0.0000'}
            </div>
          </div>

          {/* Profit */}
          <ProfitDisplay
            profit={(state?.totalEarned || 0) - (state?.totalSpent || 0)}
            label="Net Profit"
          />
        </div>

        {/* Metrics row */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-white">{state?.tasksCompleted || 0}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-white">{state?.tasksFailed || 0}</div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-white">
                {metrics.taskSuccessRate > 0 ? `${(metrics.taskSuccessRate * 100).toFixed(0)}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-white">
                ${metrics.profitPerTask > 0 ? metrics.profitPerTask.toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-gray-400">Avg Profit/Task</div>
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Gig selector */}
          <div className="md:col-span-1">
            <GigSelector gigs={gigs} onSelect={handleCreateTask} />
          </div>

          {/* Task list */}
          <div className="md:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity size={20} className="text-locus-400" />
                Recent Tasks
              </h2>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks yet. Create a new gig to get started!
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {tasks
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-6 text-center text-gray-500 text-sm">
        <p>
          Powered by <a href="https://paywithlocus.com" className="text-locus-400 hover:underline">Locus</a> —
          Agents can pay.
        </p>
      </footer>
    </div>
  );
}

export default App;