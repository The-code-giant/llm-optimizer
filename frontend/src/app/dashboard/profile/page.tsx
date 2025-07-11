"use client";
import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile, UserProfile as UserProfileType } from "../../../lib/api";
import Toast from "../../../components/Toast";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { DashboardLayout } from "../../../components/ui/dashboard-layout";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState({
    dashboardView: 'grid' as 'grid' | 'list',
    emailNotifications: true,
    autoAnalysis: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Mock user data for now - in a real app this would come from your auth system
  const mockUser = {
    id: "user_123",
    email: "user@example.com",
    lastSignInAt: new Date().toISOString(),
    emailAddresses: [{ emailAddress: "user@example.com" }]
  };

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        // For now, we'll use mock data - in a real app you'd fetch from your API
        const mockProfile: UserProfileType = {
          id: "user_123",
          email: "user@example.com",
          name: "John Doe",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            dashboardView: 'grid',
            emailNotifications: true,
            autoAnalysis: false,
          },
          statistics: {
            sitesCount: 3,
            pagesCount: 15,
            deploymentsCount: 8,
            analysisCount: 42,
            recentActivity: [
              {
                id: "1",
                type: "content_injection",
                pageUrl: "https://example.com/blog/post-1",
                siteName: "Example Site",
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              },
              {
                id: "2",
                type: "page_view",
                pageUrl: "https://example.com/about",
                siteName: "Example Site",
                timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              },
            ]
          }
        };
        
        setProfile(mockProfile);
        setName(mockProfile.name || "");
        if (mockProfile.preferences) {
          setPreferences({
            dashboardView: mockProfile.preferences.dashboardView || 'grid',
            emailNotifications: mockProfile.preferences.emailNotifications ?? true,
            autoAnalysis: mockProfile.preferences.autoAnalysis ?? false,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // For now, we'll just update the local state
      // In a real app, you'd call updateUserProfile API
      const updated = { ...profile!, name, preferences };
      setProfile(updated);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setToast({ message: err instanceof Error ? err.message : "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function getEventTypeColor(eventType: string) {
    switch (eventType) {
      case 'content_request': return 'bg-blue-100 text-blue-800';
      case 'page_view': return 'bg-green-100 text-green-800';
      case 'content_injection': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account & Security' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Managing account for {mockUser.email}
          </p>
        </div>

        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {loading ? (
                <Card className="p-8">
                  <div className="text-center">Loading profile...</div>
                </Card>
              ) : error ? (
                <Card className="p-8">
                  <div className="text-red-600 text-center">{error}</div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Profile Form */}
                  <div className="lg:col-span-2">
                    <Card className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                      <form onSubmit={handleSave} className="space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name
                          </label>
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your display name"
                            disabled={saving}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={profile?.email || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">Email is managed by your authentication provider</p>
                        </div>

                        <button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Profile"}
                        </button>
                      </form>
                    </Card>
                  </div>

                  {/* Statistics Sidebar */}
                  <div className="space-y-6">
                    {/* Account Statistics */}
                    {profile?.statistics && (
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Sites</span>
                            <span className="text-lg font-semibold text-gray-900">{profile.statistics.sitesCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pages</span>
                            <span className="text-lg font-semibold text-gray-900">{profile.statistics.pagesCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Content Deployments</span>
                            <span className="text-lg font-semibold text-gray-900">{profile.statistics.deploymentsCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Analyses Completed</span>
                            <span className="text-lg font-semibold text-gray-900">{profile.statistics.analysisCount}</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Account Info */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Member since</span>
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Last updated</span>
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.updatedAt ? formatDate(profile.updatedAt) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Recent Activity */}
                    {profile?.statistics?.recentActivity && profile.statistics.recentActivity.length > 0 && (
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          {profile.statistics.recentActivity.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                              <Badge className={`text-xs ${getEventTypeColor(activity.type)}`}>
                                {activity.type.replace('_', ' ')}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                  {activity.siteName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {activity.pageUrl}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatTimestamp(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account & Security</h2>
                <p className="text-gray-600 mb-6">
                  Manage your account settings, password, and security preferences.
                </p>
                
                <div className="space-y-6">
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <p className="text-sm text-gray-900">{mockUser.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Your email address is managed by your authentication provider
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account ID
                        </label>
                        <p className="text-sm text-gray-900 font-mono">{mockUser.id}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Sign-in
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(mockUser.lastSignInAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-500">Manage your authentication methods</p>
                        </div>
                        <div className="text-sm text-blue-600">
                          Configured via Auth Provider
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Password Management</p>
                          <p className="text-xs text-gray-500">Change your password and security settings</p>
                        </div>
                        <div className="text-sm text-blue-600">
                          Configured via Auth Provider
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Session Management</p>
                          <p className="text-xs text-gray-500">View and manage your active sessions</p>
                        </div>
                        <div className="text-sm text-blue-600">
                          Configured via Auth Provider
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard View</label>
                    <select
                      value={preferences.dashboardView}
                      onChange={e => setPreferences(prev => ({ ...prev, dashboardView: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="grid">Grid View</option>
                      <option value="list">List View</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={e => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                        Email notifications for analysis completion
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="autoAnalysis"
                        type="checkbox"
                        checked={preferences.autoAnalysis}
                        onChange={e => setPreferences(prev => ({ ...prev, autoAnalysis: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="autoAnalysis" className="ml-2 block text-sm text-gray-700">
                        Automatically analyze new pages
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 