import { api } from "./api";

export interface WalletBalance {
  balance: string;
  currency: string;
  formatted: string;
}

export interface CreateDepositRequest {
  amount: number;
  currency?: string;
}

export interface CreateDepositResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: string;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "refund";
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  provider?: string;
  provider_transaction_id?: string;
  withdrawal_method?: string;
  withdrawal_iban?: string;
  withdrawal_paypal_email?: string;
  stripe_payment_intent_id?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  completed_at?: string;
}

export interface TransactionListResponse {
  transactions: WalletTransaction[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface CreateWithdrawalRequest {
  amount: number;
  method: "iban" | "paypal";
  iban?: string;
  account_holder_name?: string;
  paypal_email?: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: string;
  currency: string;
  method: string;
  iban?: string;
  account_holder_name?: string;
  paypal_email?: string;
  status: "pending" | "approved" | "rejected" | "processing" | "completed" | "failed";
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletSettings {
  id: string;
  user_id: string;
  default_iban?: string;
  default_account_holder_name?: string;
  default_paypal_email?: string;
  preferred_withdrawal_method?: "iban" | "paypal";
  require_2fa_for_withdrawal: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateWalletSettingsRequest {
  default_iban?: string;
  default_account_holder_name?: string;
  default_paypal_email?: string;
  preferred_withdrawal_method?: "iban" | "paypal";
  require_2fa_for_withdrawal?: boolean;
}

export const walletApi = {
  // Balance
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get("/wallet/balance");
    return response.data;
  },

  // Deposits
  createDeposit: async (data: CreateDepositRequest): Promise<CreateDepositResponse> => {
    const response = await api.post("/wallet/deposit", data);
    return response.data;
  },

  // Transactions
  getTransactions: async (page = 1, perPage = 20): Promise<TransactionListResponse> => {
    const response = await api.get(`/wallet/transactions?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Withdrawals
  createWithdrawal: async (data: CreateWithdrawalRequest): Promise<WithdrawalRequest> => {
    const response = await api.post("/wallet/withdraw", data);
    return response.data;
  },

  getWithdrawals: async (page = 1, perPage = 20): Promise<WithdrawalRequest[]> => {
    const response = await api.get(`/wallet/withdrawals?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<WalletSettings> => {
    const response = await api.get("/wallet/settings");
    return response.data;
  },

  updateSettings: async (data: UpdateWalletSettingsRequest): Promise<WalletSettings> => {
    const response = await api.put("/wallet/settings", data);
    return response.data;
  },

  // Confirm deposit (verify with Stripe and credit wallet instantly)
  confirmDeposit: async (paymentIntentId: string): Promise<WalletBalance> => {
    const response = await api.post("/wallet/deposit/confirm", {
      payment_intent_id: paymentIntentId,
    });
    return response.data;
  },
};
