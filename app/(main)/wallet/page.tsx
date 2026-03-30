"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  History,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  walletApi,
  WalletBalance,
  WalletTransaction,
  WithdrawalRequest,
  WalletSettings,
  TransactionListResponse,
} from "@/lib/api-wallet";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

/** Format a number as €X.XX */
function formatAmount(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return `€${(isNaN(num) ? 0 : num).toFixed(2)}`;
}

// ─── Payment Form Component ─────────────────────────────────────────────────
function PaymentForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setIsLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Verify with backend and credit wallet instantly
      try {
        await walletApi.confirmDeposit(paymentIntent.id);
        toast.success("Payment successful! Balance updated.");
      } catch {
        toast.success("Payment received! Balance will update shortly.");
      }
      onSuccess();
    } else {
      toast.info("Payment is being processed...");
      onSuccess();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !stripe ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading payment form...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

// ─── Deposit Section ─────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [5, 10, 25, 50, 100];
const MIN_DEPOSIT = 1;
const MAX_DEPOSIT = 10000;

function DepositSection({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAmount = (val: string): string | null => {
    const num = parseFloat(val);
    if (!val || isNaN(num)) return "Please enter a valid amount";
    if (num < MIN_DEPOSIT) return `Minimum deposit is ${formatAmount(MIN_DEPOSIT)}`;
    if (num > MAX_DEPOSIT) return `Maximum deposit is ${formatAmount(MAX_DEPOSIT)}`;
    return null;
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (error) setError(validateAmount(val));
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setError(null);
  };

  const handleCreateDeposit = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await walletApi.createDeposit({
        amount: parseFloat(amount),
        currency: "EUR",
      });
      if (response.client_secret) {
        setClientSecret(response.client_secret);
      } else {
        toast.error("No client secret received from server");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to create deposit";
      toast.error(msg);
    }
    setIsLoading(false);
  };

  if (!stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <p className="mt-4 font-medium">Stripe not configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment processing is currently unavailable. Please contact support.
        </p>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Depositing <span className="font-bold">{formatAmount(parseFloat(amount))}</span>
          </p>
        </div>
        <div className="min-h-[300px]">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1877f2",
                },
              },
            }}
          >
            <PaymentForm clientSecret={clientSecret} onSuccess={onSuccess} />
          </Elements>
        </div>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => { setClientSecret(null); setAmount(""); }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Quick Amount</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((val) => (
            <Button
              key={val}
              type="button"
              variant={amount === val.toString() ? "primary" : "outline"}
              size="sm"
              onClick={() => handleQuickAmount(val)}
            >
              {formatAmount(val)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deposit-amount">Custom Amount (EUR)</Label>
        <Input
          id="deposit-amount"
          type="number"
          min={MIN_DEPOSIT}
          max={MAX_DEPOSIT}
          step="0.01"
          placeholder={`${formatAmount(MIN_DEPOSIT)} – ${formatAmount(MAX_DEPOSIT)}`}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          error={error ?? undefined}
        />
      </div>

      <Button
        onClick={handleCreateDeposit}
        disabled={isLoading || !amount}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Add Funds
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Withdraw Section ────────────────────────────────────────────────────────
function WithdrawSection({
  balance,
  settings,
  onSuccess,
}: {
  balance: number;
  settings: WalletSettings | null;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"iban" | "paypal">(
    settings?.preferred_withdrawal_method || "iban"
  );
  const [iban, setIban] = useState(settings?.default_iban || "");
  const [accountHolder, setAccountHolder] = useState(
    settings?.default_account_holder_name || ""
  );
  const [paypalEmail, setPaypalEmail] = useState(
    settings?.default_paypal_email || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync from settings when they load/change
  useEffect(() => {
    if (settings) {
      if (settings.preferred_withdrawal_method) setMethod(settings.preferred_withdrawal_method);
      if (settings.default_iban) setIban(settings.default_iban);
      if (settings.default_account_holder_name) setAccountHolder(settings.default_account_holder_name);
      if (settings.default_paypal_email) setPaypalEmail(settings.default_paypal_email);
    }
  }, [settings]);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      toast.error("Minimum withdrawal amount is €100.00");
      return;
    }
    if (numAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (method === "iban" && (!iban || !accountHolder)) {
      toast.error("Please fill in IBAN and account holder name");
      return;
    }
    if (method === "paypal" && !paypalEmail) {
      toast.error("Please enter your PayPal email");
      return;
    }

    setIsLoading(true);
    try {
      await walletApi.createWithdrawal({
        amount: numAmount,
        method,
        iban: method === "iban" ? iban : undefined,
        account_holder_name: method === "iban" ? accountHolder : undefined,
        paypal_email: method === "paypal" ? paypalEmail : undefined,
      });
      toast.success("Withdrawal request submitted successfully");
      setAmount("");
      onSuccess();
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
    setIsLoading(false);
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Available balance: <span className="font-bold">{formatAmount(balance)}</span>
        </p>
      </div>

      <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Minimum withdrawal: €100.00</p>
            <p className="mt-1">Withdrawals are processed within 1-3 business days.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdraw-amount">Amount (EUR)</Label>
        <Input
          id="withdraw-amount"
          type="number"
          min="100"
          step="0.01"
          placeholder="Enter amount (min €100.00)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={numAmount > 0 && numAmount < 100 ? "Minimum withdrawal is €100.00" : numAmount > balance ? "Exceeds available balance" : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label>Withdrawal Method</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={method === "iban" ? "primary" : "outline"}
            onClick={() => setMethod("iban")}
            className="w-full"
          >
            <Building2 className="mr-2 h-4 w-4" />
            IBAN
          </Button>
          <Button
            type="button"
            variant={method === "paypal" ? "primary" : "outline"}
            onClick={() => setMethod("paypal")}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            PayPal
          </Button>
        </div>
      </div>

      {method === "iban" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              placeholder="Enter your IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-holder">Account Holder Name</Label>
            <Input
              id="account-holder"
              placeholder="Enter account holder name"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="paypal-email">PayPal Email</Label>
          <Input
            id="paypal-email"
            type="email"
            placeholder="Enter your PayPal email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
          />
        </div>
      )}

      <Button
        onClick={handleWithdraw}
        disabled={isLoading || numAmount < 100 || numAmount > balance}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Request Withdrawal
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: <CheckCircle className="h-3 w-3" /> },
    approved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: <CheckCircle className="h-3 w-3" /> },
    pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: <Clock className="h-3 w-3" /> },
    processing: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    failed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: <XCircle className="h-3 w-3" /> },
    cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: <XCircle className="h-3 w-3" /> },
    rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: <XCircle className="h-3 w-3" /> },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Transaction type helpers ────────────────────────────────────────────────
function getTypeIcon(type: string) {
  switch (type) {
    case "deposit":
    case "transfer_in":
    case "refund":
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    case "withdrawal":
    case "transfer_out":
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    default:
      return <History className="h-4 w-4 text-slate-400" />;
  }
}

function isCredit(type: string) {
  return type === "deposit" || type === "transfer_in" || type === "refund";
}

// ─── Transaction List (reusable) ─────────────────────────────────────────────
function TransactionList({
  transactions,
  emptyMessage = "No transactions yet",
}: {
  transactions: WalletTransaction[];
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">{getTypeIcon(tx.type)}</div>
            <div>
              <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(tx.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-medium ${isCredit(tx.type) ? "text-green-600" : "text-red-600"}`}>
              {isCredit(tx.type) ? "+" : "-"}{formatAmount(tx.amount)}
            </span>
            <StatusBadge status={tx.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Withdrawal Requests List ────────────────────────────────────────────────
function WithdrawalList({ withdrawals }: { withdrawals: WithdrawalRequest[] }) {
  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ArrowUpRight className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">No withdrawal requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {withdrawals.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              {w.method === "paypal" ? (
                <Mail className="h-4 w-4 text-blue-500" />
              ) : (
                <Building2 className="h-4 w-4 text-slate-500" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {formatAmount(w.amount)} via {w.method.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(w.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {w.rejection_reason && (
                <p className="text-xs text-red-500 mt-1">Reason: {w.rejection_reason}</p>
              )}
            </div>
          </div>
          <StatusBadge status={w.status} />
        </div>
      ))}
    </div>
  );
}

// ─── Settings Section ────────────────────────────────────────────────────────
function SettingsSection({
  settings,
  onSaved,
}: {
  settings: WalletSettings | null;
  onSaved: (s: WalletSettings) => void;
}) {
  const [iban, setIban] = useState(settings?.default_iban || "");
  const [accountHolder, setAccountHolder] = useState(settings?.default_account_holder_name || "");
  const [paypalEmail, setPaypalEmail] = useState(settings?.default_paypal_email || "");
  const [preferredMethod, setPreferredMethod] = useState<"iban" | "paypal">(
    settings?.preferred_withdrawal_method || "iban"
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setIban(settings.default_iban || "");
      setAccountHolder(settings.default_account_holder_name || "");
      setPaypalEmail(settings.default_paypal_email || "");
      setPreferredMethod(settings.preferred_withdrawal_method || "iban");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await walletApi.updateSettings({
        default_iban: iban || undefined,
        default_account_holder_name: accountHolder || undefined,
        default_paypal_email: paypalEmail || undefined,
        preferred_withdrawal_method: preferredMethod,
      });
      onSaved(updated);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bank Transfer (IBAN)</h3>
        <div className="space-y-2">
          <Label htmlFor="settings-iban">Default IBAN</Label>
          <Input
            id="settings-iban"
            placeholder="e.g. DE89 3704 0044 0532 0130 00"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-holder">Account Holder Name</Label>
          <Input
            id="settings-holder"
            placeholder="Full name on bank account"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">PayPal</h3>
        <div className="space-y-2">
          <Label htmlFor="settings-paypal">Default PayPal Email</Label>
          <Input
            id="settings-paypal"
            type="email"
            placeholder="your@email.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preferred Withdrawal Method</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={preferredMethod === "iban" ? "primary" : "outline"}
            onClick={() => setPreferredMethod("iban")}
            className="w-full"
          >
            <Building2 className="mr-2 h-4 w-4" />
            IBAN
          </Button>
          <Button
            type="button"
            variant={preferredMethod === "paypal" ? "primary" : "outline"}
            onClick={() => setPreferredMethod("paypal")}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            PayPal
          </Button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}

// ─── Main Wallet Page ────────────────────────────────────────────────────────
export default function WalletPage() {
  const router = useRouter();
  const { user, loading: isUserLoading } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balanceData, settingsData, txData, wdData] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getSettings(),
        walletApi.getTransactions(1, 20),
        walletApi.getWithdrawals(1, 20),
      ]);
      setBalance(balanceData);
      setSettings(settingsData);
      setTransactions(txData.transactions);
      setTransactionCount(txData.total_count);
      setWithdrawals(wdData);
      setTxPage(1);
    } catch {
      toast.error("Failed to load wallet data");
    }
    setIsLoading(false);
  }, []);

  const fetchTransactionPage = useCallback(async (page: number) => {
    setTxLoading(true);
    try {
      const txData = await walletApi.getTransactions(page, 20);
      setTransactions(txData.transactions);
      setTransactionCount(txData.total_count);
      setTxPage(page);
    } catch {
      toast.error("Failed to load transactions");
    }
    setTxLoading(false);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchWalletData();
    }
  }, [user, isUserLoading, router, fetchWalletData]);

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Skeleton className="h-32 w-full" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending" || w.status === "processing");
  const recentTransactions = transactions.slice(0, 5);
  const totalTxPages = Math.ceil(transactionCount / 20);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          My Wallet
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your balance, deposits, and withdrawals
        </p>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList className="flex w-full overflow-x-auto no-scrollbar">
          <Tab value="overview" icon={<Wallet className="h-4 w-4" />}>Overview</Tab>
          <Tab value="deposit" icon={<ArrowDownLeft className="h-4 w-4" />}>Deposit</Tab>
          <Tab value="withdraw" icon={<ArrowUpRight className="h-4 w-4" />}>Withdraw</Tab>
          <Tab value="history" icon={<History className="h-4 w-4" />}>History</Tab>
          <Tab value="settings" icon={<Settings className="h-4 w-4" />}>Settings</Tab>
        </TabList>

        {/* ── Overview ── */}
        <TabPanel value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold">
                    {balance ? formatAmount(balance.balance) : "€0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setActiveTab("deposit")} variant="outline">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button onClick={() => setActiveTab("withdraw")}>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={recentTransactions} />
                {transactions.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={() => setActiveTab("history")}
                  >
                    View all transactions
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {pendingWithdrawals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      Pending Withdrawals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WithdrawalList withdrawals={pendingWithdrawals} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("deposit")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add funds with card
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("withdraw")}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Withdraw to bank
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* ── Deposit ── */}
        <TabPanel value="deposit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DepositSection onSuccess={fetchWalletData} />
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── Withdraw ── */}
        <TabPanel value="withdraw" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WithdrawSection
                balance={typeof balance?.balance === "string" ? parseFloat(balance.balance) : (balance?.balance || 0)}
                settings={settings}
                onSuccess={fetchWalletData}
              />
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── History ── */}
        <TabPanel value="history" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchTransactionPage(txPage)}
                disabled={txLoading}
              >
                <RefreshCw className={`h-4 w-4 ${txLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <TransactionList transactions={transactions} />
              )}
              {totalTxPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage <= 1 || txLoading}
                    onClick={() => fetchTransactionPage(txPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {txPage} of {totalTxPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage >= totalTxPages || txLoading}
                    onClick={() => fetchTransactionPage(txPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Withdrawal Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WithdrawalList withdrawals={withdrawals} />
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── Settings ── */}
        <TabPanel value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Wallet Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsSection
                settings={settings}
                onSaved={(updated) => setSettings(updated)}
              />
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
