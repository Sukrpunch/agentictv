'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { VideoCategory } from '@/lib/types';

const aiTools = ['Sora', 'Runway', 'Kling', 'Pika', 'HeyGen', 'Synthesia', 'D-ID', 'Other'];
const categories: VideoCategory[] = ['synthwave', 'documentary', 'news', 'comedy', 'tutorial', 'nature', 'other'];

interface UploadFormData {
  title: string;
  description: string;
  category: VideoCategory;
  aiTool: string;
  channelType: 'agent' | 'human' | 'hybrid';
}

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    category: 'other',
    aiTool: '',
    channelType: 'agent',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5GB)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert('File size must be less than 5GB');
        return;
      }
      // Validate video format
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name === 'aiTool' ? 'aiTool' : name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !formData.title) {
      alert('Please select a video and enter a title');
      return;
    }

    setUploading(true);
    setUploadStatus('Initializing upload...');

    try {
      // Step 1: Get upload URL from Cloudflare
      setUploadStatus('Getting upload credentials...');
      const uploadUrlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          size: selectedFile.size,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, streamId } = await uploadUrlResponse.json();

      // Step 2: Upload file directly to Cloudflare using TUS protocol
      setUploadStatus('Uploading video...');

      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      let offset = 0;

      while (offset < selectedFile.size) {
        const chunk = selectedFile.slice(offset, Math.min(offset + chunkSize, selectedFile.size));

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/offset+octet-stream',
            'Upload-Offset': offset.toString(),
            'Upload-Length': selectedFile.size.toString(),
          },
          body: chunk,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload chunk failed');
        }

        offset += chunk.size;
        setUploadProgress(Math.round((offset / selectedFile.size) * 100));
      }

      // Step 3: Save metadata to database
      setUploadStatus('Saving video details...');

      const supabase = getSupabase();
      const { data: channelData } = await supabase
        .from('channels')
        .select('id')
        .eq('owner_email', user.email)
        .single();

      if (!channelData) {
        throw new Error('Channel not found');
      }

      const { data: videoData, error: saveError } = await supabase
        .from('videos')
        .insert([
          {
            channel_id: channelData.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            ai_tool: formData.aiTool || null,
            channel_type: formData.channelType,
            cloudflare_stream_id: streamId,
            status: 'processing',
          },
        ])
        .select();

      if (saveError) throw saveError;

      const videoId = (videoData as any)?.[0]?.id;
      setUploadStatus('Upload complete! Redirecting...');
      setTimeout(() => {
        router.push(`/watch/${videoId}`);
      }, 1500);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Checking authentication...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">You need to sign in to upload videos</p>
            <Link href="/login" className="btn-primary">
              Sign In
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
          <h1 className="text-4xl font-bold mb-2">Upload Video</h1>
          <p className="text-zinc-400 mb-12">Share your AI-generated video with the world</p>

          {/* Progress Steps */}
          <div className="flex gap-4 mb-12">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-violet-600' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: File Upload */}
            {currentStep === 1 && (
              <div className="card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Step 1: Upload Video</h2>

                <div className="border-2 border-dashed border-zinc-800 rounded-lg p-12 text-center mb-6 hover:border-violet-600 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                    disabled={uploading}
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <div className="mb-4">
                      <svg
                        className="w-16 h-16 mx-auto text-zinc-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-zinc-400">MP4, WebM, or other video formats (Max 5GB)</p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="card bg-green-500/10 border border-green-500/30 p-4 mb-6">
                    <p className="text-green-400">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedFile || uploading}
                  className="btn-primary w-full"
                >
                  Next: Video Details
                </button>
              </div>
            )}

            {/* Step 2: Metadata */}
            {currentStep === 2 && (
              <div className="card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Step 2: Video Details</h2>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="input-field"
                      placeholder="My Awesome AI Video"
                      required
                      disabled={uploading}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      className="input-field h-24 resize-none"
                      placeholder="Tell viewers about your video..."
                      disabled={uploading}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="input-field"
                      disabled={uploading}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AI Tool */}
                  <div>
                    <label className="block text-sm font-medium mb-2">AI Tool Used</label>
                    <select
                      name="aiTool"
                      value={formData.aiTool}
                      onChange={handleFormChange}
                      className="input-field"
                      disabled={uploading}
                    >
                      <option value="">None</option>
                      {aiTools.map((tool) => (
                        <option key={tool} value={tool}>
                          {tool}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channel Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Content Type</label>
                    <select
                      name="channelType"
                      value={formData.channelType}
                      onChange={handleFormChange}
                      className="input-field"
                      disabled={uploading}
                    >
                      <option value="agent">🤖 AI Generated</option>
                      <option value="human">👤 Human Created</option>
                      <option value="hybrid">🤝 Human + AI</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary flex-1"
                    disabled={uploading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn-primary flex-1"
                    disabled={!formData.title || uploading}
                  >
                    Review & Upload
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Upload */}
            {currentStep === 3 && (
              <div className="card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Step 3: Review & Upload</h2>

                <div className="space-y-4 mb-8">
                  <div className="border-b border-zinc-800 pb-4">
                    <p className="text-zinc-400 text-sm">Title</p>
                    <p className="font-semibold">{formData.title}</p>
                  </div>
                  <div className="border-b border-zinc-800 pb-4">
                    <p className="text-zinc-400 text-sm">Category</p>
                    <p className="font-semibold">{formData.category}</p>
                  </div>
                  <div className="border-b border-zinc-800 pb-4">
                    <p className="text-zinc-400 text-sm">AI Tool</p>
                    <p className="font-semibold">{formData.aiTool || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">File</p>
                    <p className="font-semibold">{selectedFile?.name}</p>
                  </div>
                </div>

                {uploadProgress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary flex-1"
                    disabled={uploading}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={uploading}>
                    {uploading ? `${uploadProgress}% - ${uploadStatus}` : 'Upload & Publish'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
