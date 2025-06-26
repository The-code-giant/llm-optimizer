"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { getSites, addSite } from "../../lib/api";
import Toast from "../../components/Toast";

interface Site {
  id: string;
  name: string;
  url: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    async function fetchSites() {
      setLoading(true);
      setError(null);
      try {
        if (!token) return;
        const data = await getSites(token);
        setSites(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load sites");
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, [token, router]);

  async function handleAddSite(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    if (!token) return;
    try {
      await addSite(token, name, url);
      setName("");
      setUrl("");
      // Refresh site list
      const data = await getSites(token);
      setSites(data);
      setToast({ message: "Site added successfully!", type: "success" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add site");
      setToast({ message: err instanceof Error ? err.message : "Failed to add site", type: "error" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
        <form onSubmit={handleAddSite} className="mb-6 flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Site Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="rounded border px-3 py-2 flex-1"
            disabled={adding}
          />
          <input
            type="url"
            placeholder="https://yoursite.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            className="rounded border px-3 py-2 flex-1"
            disabled={adding}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={adding}
          >
            {adding ? "Adding..." : "Add Site"}
          </button>
        </form>
        {loading ? (
          <div>Loading sites...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <ul className="divide-y">
            {sites.map(site => (
              <li key={site.id} className="py-3">
                <div className="font-semibold">{site.name}</div>
                <div className="text-sm text-gray-600">{site.url}</div>
                <div className="text-xs text-gray-400">Status: {site.status}</div>
              </li>
            ))}
            {sites.length === 0 && <li className="py-3 text-gray-500">No sites yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
} 