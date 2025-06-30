"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getTeamMembers, addTeamMember, TeamMember } from "../../../lib/api";
import Toast from "../../../components/Toast";

export default function TeamPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }
        const data = await getTeamMembers(token);
        setMembers(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load team members");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [isLoaded, isSignedIn, getToken, router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }
      await addTeamMember(token, email);
      setToast({ message: "Invitation sent!", type: "success" });
      setEmail("");
      // Refresh team members
      const data = await getTeamMembers(token);
      setMembers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
      setToast({ message: err instanceof Error ? err.message : "Failed to invite member", type: "error" });
    } finally {
      setInviting(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Team Management</h1>
        <form onSubmit={handleInvite} className="mb-6 flex gap-2 flex-col sm:flex-row">
          <input
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="rounded border px-3 py-2 flex-1"
            disabled={inviting}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={inviting}
          >
            {inviting ? "Inviting..." : "Invite"}
          </button>
        </form>
        {loading ? (
          <div>Loading team members...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <ul className="divide-y">
            {members.map(member => (
              <li key={member.id} className="py-3">
                <div className="font-semibold">{member.name || member.email}</div>
                <div className="text-sm text-gray-600">{member.email}</div>
                <div className="text-xs text-gray-400">Role: {member.role}</div>
                <div className="text-xs text-gray-400">Status: {member.status}</div>
                <div className="text-xs text-gray-400">Invited: {new Date(member.invitedAt).toLocaleString()}</div>
              </li>
            ))}
            {members.length === 0 && <li className="py-3 text-gray-500">No team members yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
} 