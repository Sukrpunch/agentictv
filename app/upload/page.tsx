'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';

type ContentType = 'original' | 'collab' | 'remix';
const categories = ['music-video', 'short-film', 'animation', 'ai-art', 'tutorial', 'documentary', 'other'];

interface UploadFormData {
  title: string;
  description: string;
  category: string;
  genre: string;
  tags: string;
  contentType: ContentType;
  collaborators: string;
  originalVideoTitle: string;
  originalVideoUrl: string;
  status: 'draft' | 'published';
}

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    category: 'other',
    genre: '',
    tags: '',
    contentType: 'original',
    collaborators: '',
    originalVideoTitle: '',
    originalVideoUrl: '',
    status: 'published',
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file (.mp4, .mov, .webm)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Thumbnail size must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please select a valid image file (.jpg, .png, .webp)');
        return;
      }
      setSelectedThumbnail(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !formData.title) {
      alert('Please select a video and enter a title');
      return;
    }

    setUploading(true);
    setUploadStatus('Getting upload credentials...');

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      // Step 1: Get Cloudflare upload URL
      setUploadStatus('Preparing upload...');
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

      // Step 2: Upload video directly to Cloudflare
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
          throw new Error(`Upload chunk failed: ${uploadResponse.statusText}`);
        }

        offset += chunk.size;
        setUploadProgress(Math.round((offset / selectedFile.size) * 90));
      }

      // Step 3: Upload thumbnail if provided
      let thumbnailUrl = null;
      if (selectedThumbnail) {
        setUploadStatus('Uploading thumbnail...');
        // For now, we'll use a placeholder. In production, you'd upload to a CDN
        thumbnailUrl = thumbnailPreview;
      }

      // Step 4: Create video record in database
      setUploadStatus('Saving video details...');
      const videoData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        genre: formData.genre || null,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        cloudflare_video_id: streamId,
        thumbnail_url: thumbnailUrl,
        upload_status: formData.status,
        is_collab: formData.contentType === 'collab',
        is_remix: formData.contentType === 'remix',
      };

      const createResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(videoData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to save video');
      }

      const { video } = await createResponse.json();

      setUploadProgress(100);
      setUploadStatus('✓ Video uploaded successfully!');

      setTimeout(() => {
        router.push(`/watch/${video.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message}`);
      setUploading(false);
      setUploadProgress(0);
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
          <div className="mb-12">
            <p className="text-sm text-zinc-400 mb-4">Step {currentStep} of 3</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    step <= currentStep ? 'bg-violet-600' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: File Upload */}
            {currentStep === 1 && (
              <div className="card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Upload Your Video</h2>

                {/* Video Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">Video File (required)*</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('video/')) {
                        setSelectedFile(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      dragOver
                        ? 'border-violet-600 bg-violet-600/5'
                        : 'border-zinc-700 hover:border-violet-600'
                    }`}
                  >
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="videoInput"
                      disabled={uploading}
                    />
                    <label htmlFor="videoInput" className="cursor-pointer">
                      <div className="mb-4">
                        <svg
                          className="w-16 h-16 mx-auto text-zinc-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold mb-2">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-zinc-400">MP4, WebM, or MOV (max 500MB)</p>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-4 card bg-green-500/10 border border-green-500/30 p-4">
                      <p className="text-green-400">
                        ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">Thumbnail (optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          handleThumbnailSelect({ target: { files: e.dataTransfer.files } } as any);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        dragOver
                          ? 'border-violet-600 bg-violet-600/5'
                          : 'border-zinc-700 hover:border-violet-600'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                        id="thumbnailInput"
                        disabled={uploading}
                      />
                      <label htmlFor="thumbnailInput" className="cursor-pointer text-sm">
                        <p className="font-semibold mb-1">Upload Thumbnail</p>
                        <p className="text-xs text-zinc-400">JPG, PNG, WebP (max 2MB)</p>
                      </label>
                    </div>
                    {thumbnailPreview && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThumbnail(null);
                            setThumbnailPreview('');
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedFile}
                  className="btn-primary w-full"
                >
                  Next: Video Details
                </button>
              </div>
            )}

            {/* Step 2: Video Details */}
            {currentStep === 2 && (
              <div className="card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Video Details</h2>

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
                    <label className="block text-sm font-medium mb-2">
                      Description ({formData.description.length}/500)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      className="input-field h-20 resize-none"
                      placeholder="Tell viewers about your video..."
                      maxLength={500}
                      disabled={uploading}
                    />
                  </div>

                  {/* Category & Genre */}
                  <div className="grid grid-cols-2 gap-4">
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
                            {cat.replace('-', ' ').charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Genre</label>
                      <input
                        type="text"
                        name="genre"
                        value={formData.genre}
                        onChange={handleFormChange}
                        className="input-field"
                        placeholder="e.g. Electronic"
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleFormChange}
                      className="input-field"
                      placeholder="Comma-separated tags"
                      disabled={uploading}
                    />
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Content Type</label>
                    <div className="space-y-2">
                      {(['original', 'collab', 'remix'] as const).map((type) => (
                        <label key={type} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="contentType"
                            value={type}
                            checked={formData.contentType === type}
                            onChange={handleFormChange}
                            disabled={uploading}
                          />
                          <span>
                            {type === 'original' && 'Original Content'}
                            {type === 'collab' && 'Collaboration'}
                            {type === 'remix' && 'Remix'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Collaboration Details */}
                  {formData.contentType === 'collab' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Collaborator Usernames</label>
                      <input
                        type="text"
                        name="collaborators"
                        value={formData.collaborators}
                        onChange={handleFormChange}
                        className="input-field"
                        placeholder="Comma-separated usernames"
                        disabled={uploading}
                      />
                    </div>
                  )}

                  {/* Remix Details */}
                  {formData.contentType === 'remix' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Original Video Title</label>
                        <input
                          type="text"
                          name="originalVideoTitle"
                          value={formData.originalVideoTitle}
                          onChange={handleFormChange}
                          className="input-field"
                          placeholder="Title of the original video"
                          disabled={uploading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Original Video URL (optional)</label>
                        <input
                          type="url"
                          name="originalVideoUrl"
                          value={formData.originalVideoUrl}
                          onChange={handleFormChange}
                          className="input-field"
                          placeholder="https://..."
                          disabled={uploading}
                        />
                      </div>
                    </>
                  )}
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
                <h2 className="text-2xl font-bold mb-6">Review & Upload</h2>

                <div className="space-y-4 mb-8 bg-zinc-900/50 p-6 rounded-lg">
                  <div>
                    <p className="text-zinc-400 text-sm">Title</p>
                    <p className="font-semibold">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Category</p>
                    <p className="font-semibold">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Content Type</p>
                    <p className="font-semibold">{formData.contentType}</p>
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
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={uploading}
                  >
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
