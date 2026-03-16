'use client';

import { useState } from 'react';

const reportReasons = [
  'Copyright infringement',
  'Misleading content',
  'Inappropriate content',
  'Hate speech',
  'Spam',
  'Other',
];

interface ReportButtonProps {
  contentType: 'video' | 'channel';
  contentId: string;
}

export function ReportButton({ contentType, contentId }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      alert('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason: selectedReason,
          reporter_email: email || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitted(false);
          setSelectedReason('');
          setEmail('');
        }, 2000);
      } else {
        alert('Failed to submit report');
      }
    } catch (err) {
      console.error('Report error:', err);
      alert('Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <span>⚑</span>
        <span>Report</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="card p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Report {contentType}</h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <p className="text-green-400 font-semibold mb-2">Report submitted</p>
                <p className="text-zinc-400 text-sm">Thank you for helping keep AgenticTV safe.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Select a reason...</option>
                    {reportReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field w-full"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
