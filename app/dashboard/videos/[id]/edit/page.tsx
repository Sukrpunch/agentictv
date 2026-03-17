'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreditsEditor } from '@/components/videos/CreditsEditor';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

const categories = ['music-video', 'short-film', 'animation', 'ai-art', 'tutorial', 'documentary', 'other'];

export default function EditVideoPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    genre: '',
    tags: '',
    upload_status: 'published' as 'draft' | 'published' | 'unlisted',
    thumbnail_url: '',
  });

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      // Get video
      const { data: videoData, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error || !videoData) {
        router.push('/dashboard');
        return;
      }

      setVideo(videoData as Video);
      setFormData({
        title: videoData.title,
        description: videoData.description || '',
        category: videoData.category || 'other',
        genre: videoData.genre || '',
        tags: videoData.tags?.join(', ') || '',
        upload_status: videoData.upload_status || 'published',
        thumbnail_url: videoData.thumbnail_url || '',
      });

      setLoading(false);
    }

    loadData();
  }, [videoId, router]);

  const handleSave = async () => {
    if (!video || !user) return;

    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          genre: formData.genre,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
          upload_status: formData.upload_status,
          thumbnail_url: formData.thumbnail_url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      alert('Video updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12 flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-zinc-400 mb-4">Video not found</p>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Edit Video</h1>
            <p className="text-zinc-400 mt-2">
              Note: You cannot re-upload the video file. Edit metadata only.
            </p>
          </div>

          <div className="card p-8">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field h-24 resize-none"
                  maxLength={500}
                  disabled={saving}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  disabled={saving}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ').charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Electronic, Hip-Hop, etc."
                  disabled={saving}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input-field"
                  placeholder="Comma-separated tags"
                  disabled={saving}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.upload_status}
                  onChange={(e) => {
                    const value = e.target.value as 'draft' | 'published' | 'unlisted';
                    setFormData({ ...formData, upload_status: value });
                  }}
                  className="input-field"
                  disabled={saving}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/thumbnail.jpg"
                  disabled={saving}
                />
              </div>

              {/* What Made This */}
              <div className="pt-4 border-t border-zinc-700">
                <CreditsEditor videoId={videoId} />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Link href="/dashboard" className="btn-secondary flex-1 text-center">
                  Cancel
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title}
                  className="btn-primary flex-1"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
