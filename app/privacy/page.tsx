'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-zinc-400">Last updated: March 2026</p>
          </div>

          {/* Table of Contents */}
          <nav className="card p-6 mb-12 bg-zinc-900/50">
            <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
            <ul className="space-y-2">
              <li><a href="#overview" className="text-violet-400 hover:text-violet-300">1. Overview</a></li>
              <li><a href="#data-collection" className="text-violet-400 hover:text-violet-300">2. Data We Collect</a></li>
              <li><a href="#data-usage" className="text-violet-400 hover:text-violet-300">3. How We Use Your Data</a></li>
              <li><a href="#storage" className="text-violet-400 hover:text-violet-300">4. Data Storage & Security</a></li>
              <li><a href="#cloudflare" className="text-violet-400 hover:text-violet-300">5. Cloudflare Stream</a></li>
              <li><a href="#ai-disclosure" className="text-violet-400 hover:text-violet-300">6. AI Content Disclosure</a></li>
              <li><a href="#cookies" className="text-violet-400 hover:text-violet-300">7. Cookies & Tracking</a></li>
              <li><a href="#rights" className="text-violet-400 hover:text-violet-300">8. Your Rights</a></li>
              <li><a href="#contact" className="text-violet-400 hover:text-violet-300">9. Contact Us</a></li>
            </ul>
          </nav>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-8">
            {/* Section 1 */}
            <section id="overview" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
              <p className="text-zinc-300 mb-4">
                AgenticTV ("we," "our," "us," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
              <p className="text-zinc-300">
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Services. By accessing or using AgenticTV, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collection" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
              <div className="space-y-4 text-zinc-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                  <p>When you register for an account, we collect your email address, display name, and profile information. Creators may also provide channel descriptions, profile pictures, and channel type preferences.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Video & Creator Content</h3>
                  <p>We store metadata about videos you upload, including titles, descriptions, categories, thumbnails, and AI tool information. The actual video files are stored by Cloudflare Stream, not on our servers.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Usage Data</h3>
                  <p>We automatically collect information about how you interact with our platform, including video views, watch time, clicks, and engagement metrics. This data helps us improve the user experience and provide recommendations.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Device & Technical Information</h3>
                  <p>We collect information about your device, browser, IP address, and operating system. This information is used to troubleshoot issues, prevent abuse, and ensure compatibility.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="data-usage" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
              <div className="space-y-3 text-zinc-300">
                <p>• Provide and maintain our Services</p>
                <p>• Process transactions and send related information</p>
                <p>• Send promotional communications (with your consent)</p>
                <p>• Analyze usage patterns to improve the platform</p>
                <p>• Detect and prevent fraud or abuse</p>
                <p>• Comply with legal obligations</p>
                <p>• Enforce our Terms of Service and other agreements</p>
                <p>• Generate analytics and business intelligence</p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="storage" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Storage & Security</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  Your account information and metadata is stored securely in Supabase, a PostgreSQL-based platform with enterprise-grade encryption. We use SSL/TLS encryption for all data in transit. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
                <p>
                  We implement security measures including role-based access control, regular backups, and monitoring for suspicious activities. Access to user data is restricted to authorized personnel only.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="cloudflare" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">5. Cloudflare Stream</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  Video files uploaded to AgenticTV are processed and stored by Cloudflare Stream, a third-party video hosting service. By uploading videos, you consent to Cloudflare's handling of your video data in accordance with their <a href="https://www.cloudflare.com/privacy/" className="text-violet-400 hover:text-violet-300" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
                <p>
                  Cloudflare provides analytics about video views, geographic distribution, and device information. We do not control Cloudflare's data practices beyond what is necessary for our Services.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="ai-disclosure" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">6. AI Content Disclosure</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  AgenticTV is a platform exclusively for AI-generated video content. All videos on our platform are created using artificial intelligence tools (such as Sora, Runway, Synthesia, etc.). We require creators to disclose the AI tool used to generate each video.
                </p>
                <p>
                  By using AgenticTV, you acknowledge that all content is AI-generated and has not been created by human filmmakers. We are committed to transparency about the use of artificial intelligence in content creation.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="cookies" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies & Tracking</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  We use cookies to enhance your experience on our platform. These cookies help us remember your preferences, keep you logged in, and analyze how you use the service. You can control cookie settings through your browser preferences.
                </p>
                <p>
                  We may use third-party analytics services (such as Google Analytics) to understand how visitors use our platform. These services may place their own cookies on your device.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="rights" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  Depending on your location, you may have the right to access, correct, or delete your personal information. You may also have the right to data portability and the right to restrict or object to processing.
                </p>
                <p>
                  To exercise these rights, contact us at <a href="mailto:mason@agentictv.ai" className="text-violet-400 hover:text-violet-300">mason@agentictv.ai</a>. We will respond to your request within 30 days.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="contact" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                  <p className="font-semibold text-white">AgenticTV</p>
                  <p>Email: <a href="mailto:mason@agentictv.ai" className="text-violet-400 hover:text-violet-300">mason@agentictv.ai</a></p>
                </div>
              </div>
            </section>
          </div>

          {/* Links */}
          <div className="mt-12 flex gap-4 justify-center">
            <Link href="/terms" className="btn-secondary px-8 py-3">
              Terms of Service
            </Link>
            <Link href="/browse" className="btn-primary px-8 py-3">
              Back to Browse
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
