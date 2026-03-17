'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoCard } from '@/components/VideoCard';
import { FollowButton } from '@/components/social/FollowButton';
import { getSupabase } from '@/lib/supabase';
import { Profile, Video } from '@/lib/types';

type Tab = 'videos' | 'collabs' | 'remixes';

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [collabVideos, setCollabVideos] = useState<Video[]>([]);
  const [remixVideos, setRemixVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getSupabase();

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch profile by username
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error || !profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setBioText(profileData.bio || '');

        // Fetch videos created by this user
        const { data: videoData } = await supabase
          .from('videos')
          .select('*')
          .eq('creator_id', profileData.id)
          .eq('is_collab', false)
          .eq('is_remix', false)
          .eq('status', 'ready')
          .order('created_at', { ascending: false });

        setVideos(videoData || []);

        // Fetch collab videos
        const { data: collabData } = await supabase
          .from('videos')
          .select('*')
          .eq('creator_id', profileData.id)
          .eq('is_collab', true)
          .eq('status', 'ready')
          .order('created_at', { ascending: false });

        setCollabVideos(collabData || []);

        // Fetch remix videos
        const { data: remixData } = await supabase
          .from('videos')
          .select('*')
          .eq('creator_id', profileData.id)
          .eq('is_remix', true)
          .eq('status', 'ready')
          .order('created_at', { ascending: false });

        setRemixVideos(remixData || []);
      } catch (error) {
        console.error('Error loading profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [username]);

  async function handleBioUpdate() {
    if (!profile || !user || user.id !== profile.id) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioText })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, bio: bioText });
      setEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      alert('Failed to update bio');
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-zinc-400">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen px-6 py-12">
          <div className="max-w-6xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Creator Not Found</h1>
            <p className="text-zinc-400 mb-6">The creator you're looking for doesn't exist.</p>
            <Link href="/creators" className="text-violet-400 hover:text-violet-300">
              ← Back to Creators
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const currentVideos =
    activeTab === 'videos' ? videos : activeTab === 'collabs' ? collabVideos : remixVideos;

  return (
    <>
      <Header />

      <main className="min-h-screen px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="mb-12">
            <div className="card p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center text-5xl font-bold text-violet-300 border-2 border-violet-500/30">
                    {profile.display_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl font-bold mb-1">{profile.display_name}</h1>
                  <p className="text-zinc-400 mb-4">@{profile.username}</p>

                  {/* Bio */}
                  {editingBio && isOwnProfile ? (
                    <div className="mb-4">
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Tell everyone about yourself..."
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleBioUpdate}
                          className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                        >
                          Save Bio
                        </button>
                        <button
                          onClick={() => {
                            setEditingBio(false);
                            setBioText(profile.bio || '');
                          }}
                          className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-300 mb-4 max-w-2xl">
                      {profile.bio || 'No bio yet'}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 mb-6">
                    <div>
                      <p className="text-zinc-400 text-sm">Videos</p>
                      <p className="text-2xl font-bold">
                        {videos.length + collabVideos.length + remixVideos.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Followers</p>
                      <p className="text-2xl font-bold">{profile.follower_count}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Following</p>
                      <p className="text-2xl font-bold">{profile.following_count}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {isOwnProfile && !editingBio && (
                      <button
                        onClick={() => setEditingBio(true)}
                        className="px-6 py-2 rounded-lg font-medium bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-all"
                      >
                        Edit Profile
                      </button>
                    )}
                    {!isOwnProfile && (
                      <FollowButton
                        targetUserId={profile.id}
                        initialFollowerCount={profile.follower_count}
                        displayName={profile.display_name}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex gap-4 border-b border-zinc-800">
              {[
                { id: 'videos' as Tab, label: 'Videos', count: videos.length },
                { id: 'collabs' as Tab, label: 'Collaborations', count: collabVideos.length },
                { id: 'remixes' as Tab, label: 'Remixes', count: remixVideos.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Videos Grid */}
          <div>
            {currentVideos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">
                  {activeTab === 'videos'
                    ? 'No videos yet'
                    : activeTab === 'collabs'
                    ? 'No collaborations yet'
                    : 'No remixes yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
