'use client';

import { useState, useEffect } from 'react';

interface Tool {
  name: string;
  version: string;
  role: string;
}

interface CreditsEditorProps {
  videoId: string;
  onSave?: (data: CreditsData) => void;
}

export interface CreditsData {
  tools: Tool[];
  prompt: string;
  notes: string;
  show_prompt: boolean;
}

const roleOptions = [
  'video generation',
  'editing',
  'soundtrack',
  'voiceover',
  'concept art',
  'animation',
  'color grading',
  'effects',
  'other',
];

export function CreditsEditor({ videoId, onSave }: CreditsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch(`/api/videos/${videoId}/credits`);
        if (res.ok) {
          const data = await res.json();
          if (data.credits) {
            setTools(data.credits.tools || []);
            setPrompt(data.credits.prompt || '');
            setNotes(data.credits.notes || '');
            setShowPrompt(data.credits.show_prompt || false);
          }
        }
      } catch (err) {
        console.error('Error fetching credits:', err);
      } finally {
        setLoading(false);
      }
    }

    if (videoId) {
      fetchCredits();
    }
  }, [videoId]);

  const addTool = () => {
    setTools([
      ...tools,
      { name: '', version: '', role: 'other' },
    ]);
  };

  const removeTool = (idx: number) => {
    setTools(tools.filter((_, i) => i !== idx));
  };

  const updateTool = (idx: number, field: keyof Tool, value: string) => {
    const newTools = [...tools];
    newTools[idx] = { ...newTools[idx], [field]: value };
    setTools(newTools);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Not authenticated');
        return;
      }

      const res = await fetch(`/api/videos/${videoId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tools: tools.filter((t) => t.name.trim()),
          prompt,
          notes,
          show_prompt: showPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onSave) {
          onSave({
            tools: data.credits.tools,
            prompt: data.credits.prompt,
            notes: data.credits.notes,
            show_prompt: data.credits.show_prompt,
          });
        }
        alert('Credits saved!');
        setIsOpen(false);
      } else {
        alert('Failed to save credits');
      }
    } catch (err) {
      console.error('Error saving credits:', err);
      alert('Error saving credits');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-400">Loading credits...</div>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
      >
        {isOpen ? '▼ Close' : '▶ What Made This?'}
      </button>

      {isOpen && (
        <div className="space-y-4 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          {/* Tools Section */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-2">Tools Used</h4>
            <div className="space-y-2 mb-3">
              {tools.map((tool, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Tool name (e.g., Runway)"
                    value={tool.name}
                    onChange={(e) => updateTool(idx, 'name', e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500"
                  />
                  <input
                    type="text"
                    placeholder="Version"
                    value={tool.version}
                    onChange={(e) => updateTool(idx, 'version', e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500"
                  />
                  <select
                    value={tool.role}
                    onChange={(e) => updateTool(idx, 'role', e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeTool(idx)}
                    className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addTool}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              + Add Tool
            </button>
          </div>

          {/* Prompt Section */}
          <div>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrompt}
                onChange={(e) => setShowPrompt(e.target.checked)}
                className="w-4 h-4 bg-zinc-900 border border-zinc-700 rounded cursor-pointer"
              />
              <span className="text-sm font-semibold text-zinc-200">
                Share prompt publicly
              </span>
            </label>
            <textarea
              placeholder="Prompt used (only shown if checkbox above is enabled)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 font-mono resize-none h-24"
            />
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-sm font-semibold text-zinc-200 block mb-2">
              Process Notes
            </label>
            <textarea
              placeholder="Share your creative process, challenges, anything interesting!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 resize-none h-24"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2 rounded transition-colors"
          >
            {saving ? 'Saving...' : 'Save Credits'}
          </button>
        </div>
      )}
    </div>
  );
}
