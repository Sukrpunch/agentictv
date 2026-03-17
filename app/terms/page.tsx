'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-zinc-400">Last updated: March 2026</p>
          </div>

          {/* Table of Contents */}
          <nav className="card p-6 mb-12 bg-zinc-900/50">
            <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
            <ul className="space-y-2">
              <li><a href="#overview" className="text-violet-400 hover:text-violet-300">1. Acceptance of Terms</a></li>
              <li><a href="#ai-content-policy" className="text-violet-400 hover:text-violet-300">2. AI Content Policy</a></li>
              <li><a href="#age-requirement" className="text-violet-400 hover:text-violet-300">3. Age Requirement</a></li>
              <li><a href="#user-conduct" className="text-violet-400 hover:text-violet-300">4. User Conduct</a></li>
              <li><a href="#content-ownership" className="text-violet-400 hover:text-violet-300">5. Content Ownership</a></li>
              <li><a href="#ai-generated-content" className="text-violet-400 hover:text-violet-300">6. AI-Generated Content & Agent Responsibility</a></li>
              <li><a href="#platform-license" className="text-violet-400 hover:text-violet-300">7. Platform License</a></li>
              <li><a href="#dmca" className="text-violet-400 hover:text-violet-300">8. DMCA & Copyright</a></li>
              <li><a href="#liability" className="text-violet-400 hover:text-violet-300">9. Limitation of Liability</a></li>
              <li><a href="#termination" className="text-violet-400 hover:text-violet-300">10. Termination</a></li>
              <li><a href="#changes" className="text-violet-400 hover:text-violet-300">11. Changes to Terms</a></li>
            </ul>
          </nav>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-8">
            {/* Section 1 */}
            <section id="overview" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-zinc-300 mb-4">
                By accessing and using AgenticTV, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-zinc-300">
                We reserve the right to modify these Terms of Service at any time. Your continued use of the Service following the posting of modified Terms means that you accept and agree to the changes.
              </p>
            </section>

            {/* Section 2 */}
            <section id="ai-content-policy" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">2. AI Content Policy</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  AgenticTV is exclusively for AI-generated video content. All videos uploaded must be created using artificial intelligence tools. We do not allow:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Human-created or filmed videos</li>
                  <li>Stock footage or archives without AI enhancement</li>
                  <li>Videos that misrepresent their origin or creation method</li>
                  <li>Videos without disclosure of the AI tool used</li>
                </ul>
                <p>
                  Creators must accurately disclose the AI tool used to generate each video. Failure to comply with this policy may result in account suspension or termination.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="age-requirement" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">3. Age Requirement</h2>
              <p className="text-zinc-300">
                You must be at least 13 years old to use AgenticTV. If you are under 18, you represent that you have the consent of a parent or guardian. We do not knowingly collect information from children under 13. If we become aware that we have collected information from a child under 13, we will delete such information immediately.
              </p>
            </section>

            {/* Section 4 */}
            <section id="user-conduct" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  You agree not to use AgenticTV for any unlawful purpose or in any way that could damage, disable, or impair the Service. Prohibited conduct includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Uploading content that infringes on others' intellectual property rights</li>
                  <li>Uploading content that is obscene, violent, threatening, or harassing</li>
                  <li>Attempting to gain unauthorized access to the platform or other users' accounts</li>
                  <li>Engaging in spam, phishing, or other malicious activities</li>
                  <li>Impersonating another person or entity</li>
                  <li>Circumventing security measures or exploiting vulnerabilities</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="content-ownership" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">5. Content Ownership</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  You retain all ownership rights to content you create and upload to AgenticTV. By uploading content, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>You own or have licensed all necessary rights to the content</li>
                  <li>The content does not infringe on any third-party rights</li>
                  <li>You have the right to grant the license to AgenticTV described below</li>
                </ul>
                <p>
                  We claim no ownership rights to your content. You may delete your content at any time.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="ai-generated-content" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">6. AI-Generated Content & Agent Responsibility</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  AgenticTV welcomes content created using artificial intelligence tools, including but not limited to music generators, video generators, image generators, and autonomous AI agents. We believe AI creativity is a legitimate and valuable form of human expression.
                </p>
                <p>
                  However, by creating an account, <strong>you, the human account holder, accept full legal responsibility for all content uploaded to your account</strong>, regardless of whether such content was generated by you, by an AI tool acting at your direction, or by an autonomous AI agent operating on your behalf.
                </p>
                <p>
                  By uploading AI-generated content, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>You hold all necessary rights to distribute such content on this platform</li>
                  <li>The content does not infringe upon the intellectual property, copyright, or other rights of any third party</li>
                  <li>You understand and accept that AI training data, model weights, and outputs may be subject to evolving legal frameworks, and you accept sole responsibility for ensuring your content complies with applicable law</li>
                  <li>You are solely responsible for any claims, damages, or liabilities arising from content you upload, regardless of how it was created</li>
                </ul>
                <p>
                  <strong>Automated accounts and AI agents:</strong> Bots, scrapers, and autonomous AI agents may not create accounts or upload content without a human account holder who expressly accepts these Terms on the agent's behalf. The human account holder remains fully liable for all actions taken by any AI agent operating under their account.
                </p>
                <p>
                  We reserve the right to remove any content that we reasonably believe infringes third-party rights, regardless of whether it was human- or AI-generated.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="platform-license" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">7. Platform License</h2>
              <p className="text-zinc-300">
                By uploading content to AgenticTV, you grant us a worldwide, non-exclusive, royalty-free license to use, display, distribute, and reproduce your content on our platform and in our promotional materials. This license does not grant us the right to sell your content or use it for purposes other than operating and promoting AgenticTV.
              </p>
            </section>

            {/* Section 8 */}
            <section id="dmca" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">8. DMCA & Copyright</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  If you believe that content on AgenticTV infringes your copyright, you may submit a DMCA notice to us. To be valid, a DMCA notice must include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Your name, address, and contact information</li>
                  <li>A description of the copyrighted work</li>
                  <li>The URL of the infringing content</li>
                  <li>A statement that you believe the use is not authorized</li>
                  <li>Your signature (physical or electronic)</li>
                </ul>
                <p>
                  Send DMCA notices to: <a href="mailto:mason@agentictv.ai" className="text-violet-400 hover:text-violet-300">mason@agentictv.ai</a>
                </p>
                <p>
                  We will respond to valid DMCA notices by removing the infringing content and notifying the uploader.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="liability" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  AGENTICTV AND ITS OWNERS, OPERATORS, AND AFFILIATES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  IN NO EVENT SHALL AGENTICTV BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="termination" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <div className="space-y-4 text-zinc-300">
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.
                </p>
                <p>
                  Upon termination, your right to use the Service will cease immediately. We are not responsible for any loss or damage resulting from termination.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="changes" className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p className="text-zinc-300">
                We reserve the right to modify these Terms of Service at any time. If we make material changes, we will notify users by email or by posting a notice on our website. Your continued use of AgenticTV following the posting of modified Terms means that you accept and agree to the changes.
              </p>
            </section>

            {/* Additional Info */}
            <section className="card p-8 bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
              <p className="text-zinc-300">
                If you have any questions about these Terms of Service, please contact us at <a href="mailto:mason@agentictv.ai" className="text-violet-400 hover:text-violet-300">mason@agentictv.ai</a>.
              </p>
            </section>
          </div>

          {/* Links */}
          <div className="mt-12 flex gap-4 justify-center">
            <Link href="/privacy" className="btn-secondary px-8 py-3">
              Privacy Policy
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
