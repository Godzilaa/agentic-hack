import type { LocusConfig, WalletBalance, Transaction } from './types.js';

export class LocusClient {
  private apiKey: string;
  private apiBase: string;

  constructor(config: LocusConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = config.apiBase;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const url = `${this.apiBase}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  }

  // Wallet operations
  async getBalance(): Promise<WalletBalance> {
    const result = await this.request<WalletBalance>('/pay/balance');
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get balance');
    }
    return result.data;
  }

  async getTransactions(limit = 50): Promise<Transaction[]> {
    const result = await this.request<{ transactions: Transaction[] }>(
      `/pay/transactions?limit=${limit}`
    );
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get transactions');
    }
    return result.data.transactions;
  }

  // Wrapped API calls
  async callWrappedApi(
    provider: string,
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const result = await this.request<unknown>(
      `/wrapped/${provider}/${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );

    if (!result.success) {
      throw new Error(result.error || `API call to ${provider} failed`);
    }

    return result.data;
  }

  // x402 endpoint calls
  async callX402<T = unknown>(
    slug: string,
    params: Record<string, unknown>
  ): Promise<T> {
    const result = await this.request<T>(`/x402/${slug}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!result.success) {
      throw new Error(result.error || `x402 call to ${slug} failed`);
    }

    return result.data as T;
  }

  // Email operations (AgentMail)
  async createInbox(username: string): Promise<{ inboxId: string; email: string }> {
    const result = await this.callX402<{ inboxId: string; email: string }>(
      'agentmail-create-inbox',
      { username }
    );
    return result;
  }

  async sendEmail(
    inboxId: string,
    to: { email: string; name?: string }[],
    subject: string,
    body: string
  ): Promise<{ messageId: string }> {
    const result = await this.callX402<{ messageId: string }>(
      'agentmail-send-message',
      {
        inbox_id: inboxId,
        to,
        subject,
        body,
      }
    );
    return result;
  }

  async listMessages(inboxId: string): Promise<unknown[]> {
    const result = await this.callX402<unknown[]>('agentmail-list-messages', {
      inbox_id: inboxId,
    });
    return result;
  }

  // Send payment
  async sendUsdc(
    toAddress: string,
    amount: number,
    memo: string
  ): Promise<{ transactionId: string; status: string }> {
    const result = await this.request<{ transaction_id: string; status: string }>(
      '/pay/send',
      {
        method: 'POST',
        body: JSON.stringify({
          to_address: toAddress,
          amount,
          memo,
        }),
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to send USDC');
    }

    return {
      transactionId: result.data.transaction_id,
      status: result.data.status,
    };
  }
}

// Factory function to create client from env
export function createLocusClient(): LocusClient {
  const apiKey = process.env.LOCUS_API_KEY;
  const apiBase = process.env.LOCUS_API_BASE || 'https://api.paywithlocus.com/api';

  if (!apiKey) {
    throw new Error('LOCUS_API_KEY environment variable is required');
  }

  return new LocusClient({ apiKey, apiBase });
}