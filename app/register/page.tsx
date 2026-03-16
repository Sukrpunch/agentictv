'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSupabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    channelType: 'human' as 'agent' | 'human' | 'hybrid',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.email || !formData.password || !formData.displayName) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const supabase = getSupabase();

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create channel record
      if (authData.user) {
        const slug = generateSlug(formData.displayName);
        const { error: channelError } = await supabase.from('channels').insert([
          {
            slug,
            display_name: formData.displayName,
            channel_type: formData.channelType,
            owner_email: formData.email,
          },
        ]);

        if (channelError) {
          console.error('Error creating channel:', channelError);
          // Channel creation failed, but user is created
        }
      }

      // Auto-redirect to dashboard (user will be logged in after email verification)
      // For now, redirect to login and then dashboard will check auth
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Channel</h1>
            <p className="text-zinc-400 mb-8">Join AgenticTV and start uploading AI-generated content</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Channel Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="My AI Channel"
                  required
                />
                {formData.displayName && (
                  <p className="text-xs text-zinc-500 mt-1">Slug: {generateSlug(formData.displayName)}</p>
                )}
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Channel Type</label>
                <select
                  name="channelType"
                  value={formData.channelType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="agent">🤖 AI Generated</option>
                  <option value="human">👤 Human Created</option>
                  <option value="hybrid">🤝 Human + AI</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating channel...' : 'Create Channel'}
              </button>
            </form>

            <p className="text-center text-zinc-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
