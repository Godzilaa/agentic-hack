import { EventEmitter } from 'eventemitter3';
import type { Task, TaskStatus, AgentState, AgentMetrics } from '../lib/types.js';
import { TaskExecutor, GIG_DEFINITIONS } from './task-executor.js';
import type { LocusClient } from '../services/locus-client.js';

export class FreelanceAgent extends EventEmitter {
  private state: AgentState;
  private tasks: Map<string, Task> = new Map();
  private taskQueue: string[] = [];
  private executor: TaskExecutor;
  private locusClient: LocusClient;
  private startTime: Date;

  constructor(locusClient: LocusClient) {
    super();
    this.locusClient = locusClient;
    this.executor = new TaskExecutor(locusClient);
    this.startTime = new Date();
    this.state = {
      status: 'idle',
      walletBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getMetrics(): AgentMetrics {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const failedTasks = tasks.filter(t => t.status === 'failed');

    return {
      uptime: Date.now() - this.startTime.getTime(),
      totalProfit: this.state.totalEarned - this.state.totalSpent,
      totalRevenue: this.state.totalEarned,
      totalCosts: this.state.totalSpent,
      taskSuccessRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
      avgTaskDuration: completedTasks.length > 0
        ? completedTasks.reduce((acc, t) => {
            const duration = t.completedAt ? t.completedAt.getTime() - t.createdAt.getTime() : 0;
            return acc + duration;
          }, 0) / completedTasks.length
        : 0,
      profitPerTask: completedTasks.length > 0
        ? completedTasks.reduce((acc, t) => acc + t.profitUsd, 0) / completedTasks.length
        : 0,
      recentTasks: tasks.slice(-10),
    };
  }

  getAvailableGigs() {
    return GIG_DEFINITIONS;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  async refreshBalance(): Promise<number> {
    const balance = await this.locusClient.getBalance();
    this.state.walletBalance = parseFloat(balance.balance);
    this.emit('balance_update', this.state.walletBalance);
    return this.state.walletBalance;
  }

  createTask(type: Task['type'], input: Task['input']): Task {
    const gig = GIG_DEFINITIONS.find(g => g.type === type);
    if (!gig) {
      throw new Error(`Unknown task type: ${type}`);
    }

    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      status: 'pending',
      input,
      costUsd: 0,
      rewardUsd: gig.reward,
      profitUsd: 0,
      createdAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.taskQueue.push(task.id);
    this.emit('task_created', task);

    return task;
  }

  async start(): Promise<void> {
    this.state.status = 'idle';
    await this.refreshBalance();
    this.emit('started', this.state);

    // Start processing queue
    this.processQueue();
  }

  pause(): void {
    this.state.status = 'paused';
    this.emit('paused', this.state);
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'idle';
      this.emit('resumed', this.state);
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.state.status !== 'paused') {
      const taskId = this.taskQueue.shift();
      if (!taskId) continue;

      const task = this.tasks.get(taskId);
      if (!task) continue;

      await this.executeTask(task);
    }

    this.state.status = 'idle';
    this.emit('idle', this.state);
  }

  private async executeTask(task: Task): Promise<void> {
    this.state.status = 'working';
    this.state.currentTaskId = task.id;
    task.status = 'in_progress';
    task.costUsd = this.executor.getTaskCost(task.id);

    this.emit('task_started', task);

    try {
      const output = await this.executor.executeTask(task);
      task.output = output;
      task.costUsd = this.executor.getTaskCost(task.id) || task.costUsd;
      task.profitUsd = task.rewardUsd - task.costUsd;
      task.status = 'completed';
      task.completedAt = new Date();

      this.state.totalEarned += task.rewardUsd;
      this.state.totalSpent += task.costUsd;
      this.state.tasksCompleted++;

      this.emit('task_completed', task);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.state.tasksFailed++;

      this.emit('task_failed', { task, error });
    } finally {
      this.state.currentTaskId = undefined;
      this.state.status = 'idle';
      this.state.lastActivity = new Date();
    }
  }

  // Simulate earning rewards (in a real system, this would come from external bounties)
  async claimReward(taskId: string): Promise<{ success: boolean; amount: number }> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'completed') {
      throw new Error('Task not found or not completed');
    }

    // In a real implementation, this would integrate with an external bounty platform
    // For demo purposes, we simulate the reward
    this.state.totalEarned += task.rewardUsd;
    await this.refreshBalance();

    this.emit('reward_claimed', { taskId, amount: task.rewardUsd });
    return { success: true, amount: task.rewardUsd };
  }
}