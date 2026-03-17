'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatDate } from '@/lib/utils';

interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  tools: string;
  content_type: string;
  sample_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export default function CreatorsAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const adminKey = localStorage.getItem('admin-key');
    if (adminKey === 'authenticated') {
      setAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'AgenticAdmin2026!') {
      localStorage.setItem('admin-key', 'authenticated');
      setAuthenticated(true);
      setPassword('');
      loadData();
    } else {
      alert('Invalid password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/creators', {
        headers: { 'x-admin-key': 'AgenticAdmin2026!' },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error loading creator applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    setUpdatingId(applicationId);
    try {
      const response = await fetch(`/api/admin/creators/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'AgenticAdmin2026!',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setApplications(
          applications.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        alert('Failed to update application status');
      }
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Error updating application');
    } finally {
      setUpdatingId(null);
    }
  };

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications;
    return applications.filter((app) => app.status === activeTab);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-400';
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-600/20 text-zinc-400';
    }
  };

  const filteredApps = getFilteredApplications();

  if (!authenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6">Creator Applications</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-field w-full"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Creator Applications</h1>
            <button
              onClick={() => {
                localStorage.removeItem('admin-key');
                setAuthenticated(false);
              }}
              className="btn-secondary px-6"
            >
              Logout
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-8 border-b border-zinc-800 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
              const count =
                tab === 'all'
                  ? applications.length
                  : applications.filter((a) => a.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-violet-400 border-b-2 border-violet-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="card p-12 text-center">
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-zinc-400">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Name
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Tools
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Content Type
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Sample
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Applied
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-zinc-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                    >
                      <td className="px-6 py-4">{app.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{app.email}</td>
                      <td className="px-6 py-4 text-sm">{app.tools}</td>
                      <td className="px-6 py-4 text-sm">{app.content_type}</td>
                      <td className="px-6 py-4 text-sm">
                        {app.sample_url ? (
                          <a
                            href={app.sample_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 truncate block max-w-xs"
                            title={app.sample_url}
                          >
                            Link
                          </a>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadgeColor(
                            app.status
                          )}`}
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {app.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(app.id, 'approved')}
                              disabled={updatingId === app.id}
                              className="btn-primary px-3 py-1 text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(app.id, 'rejected')}
                              disabled={updatingId === app.id}
                              className="btn-secondary px-3 py-1 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
