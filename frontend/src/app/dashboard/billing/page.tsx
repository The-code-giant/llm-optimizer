"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth";
import { getBillingInfo, updateBillingInfo, BillingInfo } from "../../../lib/api";
import Toast from "../../../components/Toast";

export default function BillingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plan, setPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    async function fetchBilling() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBillingInfo(token);
        setBilling(data);
        setPlan(data.plan);
        setPaymentMethod(data.paymentMethod);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load billing info");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [token, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBillingInfo(token, { plan, paymentMethod });
      setBilling(updated);
      setToast({ message: "Billing info updated!", type: "success" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update billing info");
      setToast({ message: err instanceof Error ? err.message : "Failed to update billing info", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Billing & Subscription</h1>
        {loading ? (
          <div>Loading billing info...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : billing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                Plan
              </label>
              <select
                id="plan"
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <input
                id="paymentMethod"
                type="text"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={saving}
              />
            </div>
            <div className="text-sm text-gray-500">
              Status: {billing.status} <br />
              Renewal: {new Date(billing.renewalDate).toLocaleDateString()} <br />
              Amount: ${billing.amount.toFixed(2)}
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
} 