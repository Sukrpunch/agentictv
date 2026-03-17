'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { Comment, Profile } from '@/lib/types';

interface CommentsProps {
  videoId: string;
  currentTimeMs?: number;
  onSeek?: (timeMs: number) => void;
}

interface CommentWithAuthor extends Comment {
  user?: Profile;
  replies?: CommentWithAuthor[];
}

export function Comments({ videoId, currentTimeMs, onSeek }: CommentsProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    }
    initAuth();
  }, []);

  useEffect(() => {
    fetchComments(0);
  }, [videoId]);

  async function fetchComments(startOffset: number) {
    try {
      const response = await fetch(
        `/api/social/comments?video_id=${videoId}&limit=${limit}&offset=${startOffset}`
      );
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      if (startOffset === 0) {
        setComments(data);
      } else {
        setComments((prev) => [...prev, ...data]);
      }
      setOffset(startOffset + limit);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          body: newComment,
          timestamp_ms: currentTimeMs || null,
          parent_id: replyingTo || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');
      const newCommentData = await response.json();

      if (replyingTo) {
        // Add reply to parent comment
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo
              ? { ...c, replies: [...(c.replies || []), newCommentData] }
              : c
          )
        );
        setReplyText('');
        setReplyingTo(null);
      } else {
        setComments((prev) => [newCommentData, ...prev]);
      }
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/social/comments?comment_id=${commentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  function formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function CommentItem({
    comment,
    isReply = false,
  }: {
    comment: CommentWithAuthor;
    isReply?: boolean;
  }) {
    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12' : ''} py-4 border-b border-zinc-800 last:border-b-0`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
              {comment.user ? getInitials(comment.user.display_name) : 'A'}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-white">
                {comment.user?.display_name || 'Anonymous'}
              </p>
              {comment.user && (
                <Link
                  href={`/@${comment.user.username}`}
                  className="text-xs text-zinc-500 hover:text-violet-400"
                >
                  @{comment.user.username}
                </Link>
              )}
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>

            {/* Timestamp badge */}
            {comment.timestamp_ms !== null && (
              <button
                onClick={() => onSeek?.(comment.timestamp_ms!)}
                className="text-xs px-2 py-1 rounded bg-zinc-800/50 text-violet-300 hover:bg-zinc-800 mb-2 inline-block"
              >
                ⏱️ {formatTimestamp(comment.timestamp_ms)}
              </button>
            )}

            {/* Comment body */}
            <p className="text-zinc-300 break-words">{comment.body}</p>

            {/* Actions */}
            <div className="flex gap-3 mt-2 text-xs text-zinc-400">
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="hover:text-violet-400 transition-colors"
                >
                  Reply
                </button>
              )}
              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="hover:text-red-400 transition-colors"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-0">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-4 ml-12">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setNewComment(replyText);
                  handleSubmitComment();
                }}
                disabled={!replyText.trim() || submitting}
                className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="px-3 py-1 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <p className="text-zinc-400">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-xl font-bold mb-6">Comments ({comments.length})</h3>

      {/* Add Comment Form */}
      {user ? (
        <div className="mb-8 p-4 bg-zinc-800/50 rounded-lg">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setNewComment('')}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-zinc-800/50 rounded-lg text-center">
          <p className="text-zinc-400 mb-3">Sign in to leave a comment</p>
          <Link href="/login" className="inline-block px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700">
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-0">
        {comments.length === 0 ? (
          <p className="text-center text-zinc-400 py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>

      {/* Load More */}
      {comments.length >= limit && (
        <button
          onClick={() => fetchComments(offset)}
          className="w-full mt-6 px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
        >
          Load More Comments
        </button>
      )}
    </div>
  );
}
