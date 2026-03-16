'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatDate, formatViews } from '@/lib/utils';

interface Report {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_email?: string;
}

interface ProcessingVideo {
  id: string;
  title: string;
  channel_id: string;
  channel?: {
    display_name: string;
  };
  created_at: string;
  status: string;
}

interface PlatformStats {
  total_videos: number;
  total_channels: number;
  total_views: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [processingVideos, setProcessingVideos] = useState<ProcessingVideo[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');

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
      // Load reports
      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'x-admin-key': 'AgenticAdmin2026!' },
      });
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }

      // Load processing videos
      const videosRes = await fetch('/api/admin/videos', {
        headers: { 'x-admin-key': 'AgenticAdmin2026!' },
      });
      if (videosRes.ok) {
        setProcessingVideos(await videosRes.json());
      }

      // Load stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': 'AgenticAdmin2026!' },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'resolve') => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'AgenticAdmin2026!',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Update local state
        setReports(reports.map(r =>
          r.id === reportId
            ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' }
            : r
        ));
      }
    } catch (err) {
      console.error('Error updating report:', err);
    }
  };

  const handleVideoAction = async (videoId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'AgenticAdmin2026!',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Update local state
        setProcessingVideos(processingVideos.filter(v => v.id !== videoId));
      }
    } catch (err) {
      console.error('Error updating video:', err);
    }
  };

  if (!authenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
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
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
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

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="card p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Total Videos</p>
                <p className="text-4xl font-bold text-violet-400">{stats.total_videos}</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Total Channels</p>
                <p className="text-4xl font-bold text-violet-400">{stats.total_channels}</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Total Views</p>
                <p className="text-4xl font-bold text-violet-400">{formatViews(stats.total_views)}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending Reports ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'videos'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Processing Videos ({processingVideos.length})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="card p-12 text-center">
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : activeTab === 'reports' ? (
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">Content Reports</h2>
              {reports.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-zinc-400">No pending reports</p>
              ) : (
                <div className="space-y-4">
                  {reports
                    .filter(r => r.status === 'pending')
                    .map(report => (
                      <div key={report.id} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{report.content_type.toUpperCase()}</p>
                            <p className="text-sm text-zinc-400">ID: {report.content_id}</p>
                          </div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                            {report.status}
                          </span>
                        </div>
                        <p className="mb-3">
                          <strong>Reason:</strong> {report.reason}
                        </p>
                        {report.reporter_email && (
                          <p className="text-sm text-zinc-400 mb-3">
                            <strong>Reporter:</strong> {report.reporter_email}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mb-4">
                          Reported: {formatDate(report.created_at)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="btn-secondary flex-1 py-2 text-sm"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="btn-primary flex-1 py-2 text-sm"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">Processing Videos</h2>
              {processingVideos.length === 0 ? (
                <p className="text-zinc-400">No processing videos</p>
              ) : (
                <div className="space-y-4">
                  {processingVideos.map(video => (
                    <div key={video.id} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{video.title}</p>
                          <p className="text-sm text-zinc-400">
                            Channel: {video.channel?.display_name || 'Unknown'}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          {video.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-4">
                        Uploaded: {formatDate(video.created_at)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVideoAction(video.id, 'reject')}
                          className="btn-secondary flex-1 py-2 text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVideoAction(video.id, 'approve')}
                          className="btn-primary flex-1 py-2 text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
