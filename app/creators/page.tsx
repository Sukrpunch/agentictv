'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function CreatorsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tools: '',
    content_type: '',
    sample_url: '',
    acknowledges_terms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/creators/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          tools: formData.tools,
          content_type: formData.content_type,
          sample_url: formData.sample_url,
          acknowledges_terms: formData.acknowledges_terms,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        tools: '',
        content_type: '',
        sample_url: '',
        acknowledges_terms: false,
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-zinc-950">
        {/* HERO */}
        <section className="px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/20 border border-violet-600/50 mb-8">
              <span className="text-2xl">🎬</span>
              <span className="text-sm font-semibold text-violet-400">Founding Creator Program — First 100 spots</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              The Platform Built for AI Video Creators
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-3xl mx-auto">
              AgenticTV is the first video platform that celebrates — and pays — AI-generated content. Sora, Runway, Kling, Pika. Whatever you create, this is where it lives.
            </p>

            {/* CTAs */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  const form = document.getElementById('application-form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary px-8 py-4 text-lg"
              >
                Apply for Founding Creator
              </button>
              <Link href="/browse" className="btn-secondary px-8 py-4 text-lg">
                Browse the Platform
              </Link>
            </div>
          </div>
        </section>

        {/* THE OPPORTUNITY */}
        <section className="px-6 py-20 bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 text-center">
              <p className="text-2xl text-zinc-300 font-semibold">
                YouTube has 800 million videos. AI-generated content is buried. No dedicated audience. No community. No fair payment.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                AgenticTV is YouTube for AI video. We built the discovery, the community, and the revenue model — specifically for you.
              </p>
            </div>
          </div>
        </section>

        {/* HOW CREATORS GET PAID */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How Creators Get Paid</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Ad Revenue Share */}
              <div className="card p-8 bg-zinc-900/50">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-2xl font-bold mb-3">Ad Revenue Share</h3>
                <p className="text-zinc-300 mb-4">
                  Earn <span className="text-violet-400 font-bold">70% of ad revenue</span> from your videos. Forever. That's better than YouTube's 55%.
                </p>
                <p className="text-sm text-zinc-400">(Founding Creator rate)</p>
              </div>

              {/* Featured Placement */}
              <div className="card p-8 bg-zinc-900/50">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-3">Featured Placement</h3>
                <p className="text-zinc-300">
                  Homepage features and curated collections = exponential reach + bonus payouts.
                </p>
              </div>

              {/* Creator Milestones */}
              <div className="card p-8 bg-zinc-900/50">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold mb-3">Creator Milestones</h3>
                <p className="text-zinc-300">
                  Hit 1,000 views = <span className="text-violet-400 font-semibold">$2</span>. Hit 10,000 = <span className="text-violet-400 font-semibold">$25 bonus</span>. Stack milestones, stack earnings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDING CREATOR BENEFITS */}
        <section className="px-6 py-20 bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Founding Creator Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 70% Revenue Share */}
              <div className="card p-8 border-l-4 border-violet-600">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="text-xl font-bold mb-2">70% Revenue Share</h3>
                <p className="text-zinc-400 text-sm">Forever (standard: 60%)</p>
              </div>

              {/* Badge */}
              <div className="card p-8 border-l-4 border-violet-600">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-xl font-bold mb-2">Founding Creator Badge</h3>
                <p className="text-zinc-400 text-sm">Permanent on your channel</p>
              </div>

              {/* Algorithm Priority */}
              <div className="card p-8 border-l-4 border-violet-600">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-xl font-bold mb-2">Algorithm Priority</h3>
                <p className="text-zinc-400 text-sm">Your videos surface first</p>
              </div>

              {/* App Store Credits */}
              <div className="card p-8 border-l-4 border-violet-600">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-xl font-bold mb-2">App Store Credits</h3>
                <p className="text-zinc-400 text-sm">Listed in native iOS/Android app credits</p>
              </div>

              {/* Early Access */}
              <div className="card p-8 border-l-4 border-violet-600">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-xl font-bold mb-2">Early Access</h3>
                <p className="text-zinc-400 text-sm">Every feature before public launch</p>
              </div>

              {/* Limited Spots */}
              <div className="card p-8 border-l-4 border-violet-600 bg-gradient-to-br from-zinc-900/50 to-violet-950/30">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="text-xl font-bold mb-2">Only 100 Spots</h3>
                <p className="text-violet-400 font-semibold text-sm">0 of 100 claimed</p>
              </div>
            </div>
          </div>
        </section>

        {/* AI TOOLS WE SUPPORT */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">AI Tools We Support</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Sora', 'Runway', 'Kling', 'Pika', 'HeyGen', 'Synthesia', 'D-ID', 'Descript', 'Luma', 'Udio', 'Any AI Tool'].map(tool => (
                <div
                  key={tool}
                  className="px-6 py-3 rounded-full bg-violet-600/20 border border-violet-600/50 text-violet-200 font-medium"
                >
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTENT CATEGORIES */}
        <section className="px-6 py-20 bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Content Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🌆', name: 'Synthwave & Visual Art' },
                { icon: '🌿', name: 'Nature & Landscapes' },
                { icon: '📰', name: 'AI News & Commentary' },
                { icon: '😂', name: 'Comedy & Shorts' },
                { icon: '🎓', name: 'Tutorials & How-To' },
                { icon: '🚀', name: 'Sci-Fi & Fantasy' },
                { icon: '🎵', name: 'Music Videos' },
                { icon: '🔬', name: 'Science & Technology' },
              ].map(cat => (
                <div key={cat.name} className="card p-6 text-center bg-zinc-900/50">
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <p className="font-semibold text-white">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* $AGNT TOKEN REWARDS */}
        <section className="py-20 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full mb-4">
              Coming Soon
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">Earn $AGNT Tokens</h2>
            <p className="text-zinc-400 mb-2">Every view. Every like. Every feature. Converted to $AGNT — the currency of the Agentic empire.</p>
            <p className="text-xs text-zinc-600 mb-12 font-mono">
              Contract: 0x78B184807C6d64C1F2A50E5E9de5D71941B3f648 · Base Network
            </p>

            {/* Earn rates grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { action: 'Every 100 views', reward: '10 AGNT' },
                { action: 'Video featured', reward: '50 AGNT' },
                { action: 'Founding Creator', reward: '500 AGNT 🎁' },
                { action: 'Refer a creator', reward: '25 AGNT' },
              ].map((item) => (
                <div key={item.action} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-violet-400 font-bold text-lg">{item.reward}</div>
                  <div className="text-zinc-400 text-sm mt-1">{item.action}</div>
                </div>
              ))}
            </div>

            <p className="text-zinc-300">
              Redeem at the <span className="text-violet-400 font-semibold">Agentic Store</span> — t-shirts, hoodies, exclusive creator merch.{' '}
              <span className="text-white font-semibold">Earn it. Own it.</span>
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
            <div className="space-y-8">
              {[
                { step: 1, title: 'Apply', desc: 'Apply for Founding Creator status. We review within 48 hours.' },
                { step: 2, title: 'Upload', desc: 'Upload your first video and your channel goes live immediately.' },
                { step: 3, title: 'Earn', desc: 'Earn from views, featured placements, and milestone bonuses.' },
              ].map(item => (
                <div key={item.step} className="flex gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-lg">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APPLICATION FORM */}
        <section id="application-form" className="px-6 py-20 bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Ready to Get Started?</h2>
            <p className="text-center text-zinc-400 mb-12">Apply for Founding Creator status today. We'll review your application within 48 hours.</p>

            {submitted ? (
              <div className="card p-12 bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-600/50 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-2xl font-bold mb-3 text-white">Application Received!</h3>
                <p className="text-zinc-300 mb-6">
                  We'll review your application within 48 hours and send you an email at <span className="font-semibold text-violet-400">{formData.email}</span>.
                </p>
                <p className="text-zinc-400">
                  In the meantime, feel free to upload your first video and start building your channel.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 card p-8 bg-zinc-900/50">
                {error && (
                  <div className="p-4 rounded-lg bg-red-950/50 border border-red-600/50 text-red-200">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="your@email.com"
                  />
                </div>

                {/* AI Tools */}
                <div>
                  <label className="block text-sm font-semibold mb-2">What AI tools do you use? *</label>
                  <input
                    type="text"
                    name="tools"
                    value={formData.tools}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="e.g., Sora, Runway, Kling, etc."
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2">What type of content do you create? *</label>
                  <textarea
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    required
                    className="input min-h-24"
                    placeholder="Describe your content style and category..."
                  />
                </div>

                {/* Sample Work */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Link to sample work (optional)</label>
                  <input
                    type="url"
                    name="sample_url"
                    value={formData.sample_url}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://youtube.com/... or https://..."
                  />
                </div>

                {/* Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    name="acknowledges_terms"
                    checked={formData.acknowledges_terms}
                    onChange={handleInputChange}
                    required
                    className="w-5 h-5 mt-1 rounded border-zinc-600 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-zinc-300 cursor-pointer">
                    I understand monetization launches at platform launch. Founding Creators are first in line. *
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !formData.acknowledges_terms}
                  className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Apply for Founding Creator Status →'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'When does monetization go live?',
                  a: 'At platform launch. Founding Creators are first in line.',
                },
                {
                  q: 'What qualifies as AI-generated video?',
                  a: 'Videos primarily created with AI tools — Sora, Runway, Kling, Pika, etc.',
                },
                {
                  q: 'Can I upload before monetization launches?',
                  a: 'Yes. Upload now to claim your spot and build your audience.',
                },
                {
                  q: 'Is there a minimum upload requirement?',
                  a: 'Just one video to activate your channel and Founding Creator status.',
                },
                {
                  q: "What's the cost?",
                  a: 'Zero. AgenticTV is free for creators forever.',
                },
              ].map((item, idx) => (
                <div key={idx} className="card p-6 bg-zinc-900/50">
                  <h3 className="font-bold text-lg mb-2 text-white">{item.q}</h3>
                  <p className="text-zinc-300">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="px-6 py-20 bg-gradient-to-b from-transparent via-violet-600/10 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Join the Future of AI Video</h2>
            <p className="text-xl text-zinc-300 mb-12">
              Founding Creators get exclusive benefits and permanent status. Limited to 100 spots.
            </p>
            <button
              onClick={() => {
                const form = document.getElementById('application-form');
                form?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary px-8 py-4 text-lg"
            >
              Apply Now →
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
