"use client";

import React, { useCallback, useState } from "react";
import {
  getSep31Anchors,
  getSep31Info,
  getSep31Quote,
  createSep31Payment,
  getSep31Transactions,
  type Sep31AnchorInfo,
  type Sep31InfoResponse,
  type Sep31Transaction,
  type Sep31QuoteResponse,
  Sep31Error,
} from "@/services/sep31";
import {
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  Quote,
} from "lucide-react";
import {
  validateUrl,
  validateAmount,
  validateReceiverId,
  validateAssetCode,
  validateJwt,
  getFieldErrorId,
} from "../lib/validation";

export function Sep31PaymentFlow() {
  const [anchors, setAnchors] = useState<Sep31AnchorInfo[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<Sep31AnchorInfo | null>(null);
  const [customTransferServer, setCustomTransferServer] = useState("");
  const [info, setInfo] = useState<Sep31InfoResponse | null>(null);
  const [transactions, setTransactions] = useState<Sep31Transaction[]>([]);
  const [quote, setQuote] = useState<Sep31QuoteResponse | null>(null);
  const [loadingAnchors, setLoadingAnchors] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [jwt, setJwt] = useState("");
  const [sourceAsset, setSourceAsset] = useState("");
  const [destAsset, setDestAsset] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateError = (field: string, result: ReturnType<typeof validateUrl>) => {
    setErrors((prev) => ({ ...prev, [field]: result.error }));
  };

  const isFormValid = !Object.values(errors).some(Boolean);

  const transferServer = selectedAnchor?.transfer_server || customTransferServer.trim();

  const loadAnchors = useCallback(async () => {
    setLoadingAnchors(true);
    setError(null);
    try {
      const res = await getSep31Anchors();
      setAnchors(res.anchors || []);
      if (res.anchors?.length && !selectedAnchor) {
        setSelectedAnchor(res.anchors[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load anchors");
    } finally {
      setLoadingAnchors(false);
    }
  }, [selectedAnchor]);

  const loadInfo = useCallback(async () => {
    if (!transferServer) {
      setInfo(null);
      return;
    }
    setLoadingInfo(true);
    setError(null);
    try {
      const data = await getSep31Info(transferServer);
      setInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load anchor info");
      setInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  }, [transferServer]);

  const loadQuote = useCallback(async () => {
    if (!transferServer || !amount) {
      setError("Enter amount and select an anchor");
      return;
    }
    setLoadingQuote(true);
    setError(null);
    setQuote(null);
    try {
      const res = await getSep31Quote({
        transfer_server: transferServer,
        jwt: jwt || undefined,
        amount,
        sell_asset: sourceAsset || undefined,
        buy_asset: destAsset || undefined,
      });
      setQuote(res);
    } catch (e) {
      const msg =
        e instanceof Sep31Error
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to get quote";
      setError(msg);
    } finally {
      setLoadingQuote(false);
    }
  }, [transferServer, amount, sourceAsset, destAsset, jwt]);

  const loadTransactions = useCallback(async () => {
    if (!transferServer) return;
    setLoadingTx(true);
    setError(null);
    try {
      const res = await getSep31Transactions({
        transfer_server: transferServer,
        jwt: jwt || undefined,
        limit: 20,
      });
      setTransactions(res.transactions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, [transferServer, jwt]);

  React.useEffect(() => {
    loadAnchors();
  }, []);

  React.useEffect(() => {
    if (transferServer) loadInfo();
    else setInfo(null);
  }, [transferServer]);

  const handleSendPayment = async () => {
    if (!transferServer) {
      setError("Select an anchor or enter transfer server URL");
      return;
    }
    const amountResult = validateAmount(amount);
    const receiverResult = validateReceiverId(receiverId);
    updateError("amount", amountResult);
    updateError("receiverId", receiverResult);
    if (!amountResult.isValid || !receiverResult.isValid) return;
    if (!isFormValid) return;
    setSending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await createSep31Payment({
        transfer_server: transferServer,
        jwt: jwt || undefined,
        amount,
        receiver_id: receiverId || undefined,
        quote_id: quoteId || quote?.id || undefined,
        source_asset: sourceAsset || undefined,
        destination_asset: destAsset || undefined,
      });
      const id = (res as { id?: string }).id ?? (res as { transaction?: Sep31Transaction }).transaction?.id;
      setSuccessMessage(
        id
          ? `Payment initiated. Transaction ID: ${id}. Complete KYC or sender/receiver flows on the anchor if required.`
          : "Payment submitted. Check payment history for status."
      );
      setQuote(null);
      setQuoteId("");
      loadTransactions();
    } catch (e) {
      const msg =
        e instanceof Sep31Error
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to send payment";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const statusColor = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("complete") || s.includes("success")) return "text-emerald-400";
    if (s.includes("pending") || s.includes("processing")) return "text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-8">
      {/* Anchor selection */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-accent" />
          Anchor & transfer server
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Preset anchors
            </label>
            <select
              className="w-full rounded-xl bg-background/80 border border-border px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50"
              value={selectedAnchor?.transfer_server ?? ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const a = anchors.find(
                  (x: Sep31AnchorInfo) => x.transfer_server === e.target.value
                );
                setSelectedAnchor(a || null);
              }}
              disabled={loadingAnchors}
            >
              <option value="">Select an anchor</option>
              {anchors.map((a) => (
                <option key={a.transfer_server} value={a.transfer_server}>
                  {a.name} ({a.transfer_server})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={loadAnchors}
            disabled={loadingAnchors}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 flex items-center gap-2"
          >
            {loadingAnchors ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Or enter transfer server URL (SEP-31 base)
          </label>
          <input
            id="transferServer"
            type="url"
            placeholder="https://api.anchor.example/sep31"
            className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/50 ${errors.transferServer ? "border-red-500" : "border-border"}`}
            value={customTransferServer}
            aria-describedby={errors.transferServer ? getFieldErrorId("transferServer") : undefined}
            aria-invalid={!!errors.transferServer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setCustomTransferServer(value);
              setSelectedAnchor(null);
              if (value) updateError("transferServer", validateUrl(value));
              else setErrors((prev) => ({ ...prev, transferServer: "" }));
            }}
          />
          {errors.transferServer && (
            <div id={getFieldErrorId("transferServer")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.transferServer}
            </div>
          )}
        </div>
      </section>

      {/* Quote & Send payment */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Get quote & send payment
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          KYC may be required by the anchor for sender or receiver. Complete any interactive flows the anchor provides.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Amount
            </label>
            <input
              id="amount"
              type="text"
              placeholder="100"
              className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground ${errors.amount ? "border-red-500" : "border-border"}`}
              value={amount}
              aria-describedby={errors.amount ? getFieldErrorId("amount") : undefined}
              aria-invalid={!!errors.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setAmount(value);
                updateError("amount", validateAmount(value));
              }}
            />
            {errors.amount && (
              <div id={getFieldErrorId("amount")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.amount}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Receiver ID (anchor-specific)
            </label>
            <input
              id="receiverId"
              type="text"
              placeholder="receiver@anchor.com or wallet id"
              className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground ${errors.receiverId ? "border-red-500" : "border-border"}`}
              value={receiverId}
              aria-describedby={errors.receiverId ? getFieldErrorId("receiverId") : undefined}
              aria-invalid={!!errors.receiverId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setReceiverId(value);
                updateError("receiverId", validateReceiverId(value));
              }}
            />
            {errors.receiverId && (
              <div id={getFieldErrorId("receiverId")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.receiverId}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Source asset (e.g. USDC:issuer)
            </label>
            <input
              id="sourceAsset"
              type="text"
              placeholder="optional"
              className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground font-mono text-sm ${errors.sourceAsset ? "border-red-500" : "border-border"}`}
              value={sourceAsset}
              aria-describedby={errors.sourceAsset ? getFieldErrorId("sourceAsset") : undefined}
              aria-invalid={!!errors.sourceAsset}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setSourceAsset(value);
                updateError("sourceAsset", validateAssetCode(value));
              }}
            />
            {errors.sourceAsset && (
              <div id={getFieldErrorId("sourceAsset")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.sourceAsset}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Destination asset (e.g. iso4217:USD)
            </label>
            <input
              id="destAsset"
              type="text"
              placeholder="optional"
              className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground font-mono text-sm ${errors.destAsset ? "border-red-500" : "border-border"}`}
              value={destAsset}
              aria-describedby={errors.destAsset ? getFieldErrorId("destAsset") : undefined}
              aria-invalid={!!errors.destAsset}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setDestAsset(value);
                updateError("destAsset", validateAssetCode(value));
              }}
            />
            {errors.destAsset && (
              <div id={getFieldErrorId("destAsset")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.destAsset}
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            JWT (optional, from SEP-10)
          </label>
          <input
            id="jwt"
            type="password"
            placeholder="For authenticated flows"
            className={`w-full rounded-xl bg-background/80 border px-4 py-2.5 text-foreground placeholder:text-muted-foreground font-mono text-sm ${errors.jwt ? "border-red-500" : "border-border"}`}
            value={jwt}
            aria-describedby={errors.jwt ? getFieldErrorId("jwt") : undefined}
            aria-invalid={!!errors.jwt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setJwt(value);
              updateError("jwt", validateJwt(value));
            }}
          />
          {errors.jwt && (
            <div id={getFieldErrorId("jwt")} className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.jwt}
            </div>
          )}
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadQuote}
            disabled={loadingQuote || !transferServer || !amount || !isFormValid}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
          >
            {loadingQuote ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Quote className="w-4 h-4" />
            )}
            Get quote
          </button>
          <button
            type="button"
            onClick={handleSendPayment}
            disabled={sending || !transferServer || !amount || !isFormValid}
            className="rounded-xl bg-accent text-accent-foreground px-6 py-2.5 font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send payment
          </button>
        </div>
        {quote && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Quote className="w-4 h-4" />
              Quote
            </div>
            <pre className="text-xs text-foreground overflow-x-auto">
              {JSON.stringify(quote, null, 2)}
            </pre>
            {quote.id && (
              <p className="text-xs text-muted-foreground mt-2">
                Quote ID: {quote.id}. Use this when sending the payment if the anchor requires it.
              </p>
            )}
          </div>
        )}
        {transferServer && !info && loadingInfo && (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading anchor capabilities…
          </div>
        )}
      </section>

      {/* Payment history */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          Payment history
        </h2>
        {transferServer && (
          <button
            type="button"
            onClick={loadTransactions}
            disabled={loadingTx}
            className="mb-4 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 flex items-center gap-2"
          >
            {loadingTx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Load history
          </button>
        )}
        {transactions.length === 0 && !loadingTx && (
          <p className="text-muted-foreground text-sm">
            {transferServer
              ? "Click “Load history” to fetch payments (JWT may be required)."
              : "Select an anchor above to load payment history."}
          </p>
        )}
        {transactions.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: Sep31Transaction) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-white/5"
                  >
                    <td className="py-3 px-4 font-mono text-foreground text-xs">
                      {typeof tx.id === "string"
                        ? tx.id.length > 12
                          ? `${tx.id.slice(0, 12)}…`
                          : tx.id
                        : tx.id ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {tx.amount ?? tx.amount_out ?? "—"}
                    </td>
                    <td className={`py-3 px-4 ${statusColor(tx.status)}`}>
                      {tx.status}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
