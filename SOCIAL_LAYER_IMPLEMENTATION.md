# AgenticTV Social Layer Implementation

## Overview
Full social layer implementation for AgenticTV including comments, follow/following, collaboration badges, and remix flags. The system integrates seamlessly with existing Supabase auth and profiles infrastructure.

## What Was Built

### 1. Database Migration (`supabase/migration_social.sql`)
- **profiles**: User profiles linked to auth.users
- **comments**: Video comments with reply threading (1 level deep via parent_id)
- **follows**: Follow relationships between users
- **collaborations**: Track video collaborations and remixer roles
- **Video columns**: is_collab, is_remix, original_video_id, comment_count, creator_id
- **Triggers**: Auto-update follower/following counts and comment counts
- **RLS Policies**: Public read, auth-gated insert/delete

### 2. React Components

#### `components/social/Comments.tsx`
- Display comments with author profiles (avatar initials fallback)
- Relative timestamps ("2h ago")
- Timestamp badges: clickable to seek video to comment time
- Reply feature (1 level deep) with indented display
- Add comment form (requires auth, shows "Sign in" if logged out)
- Delete button on own comments (trash icon)
- Optimistic inserts
- Load more pagination (20 comments per page)
- Dark theme (zinc-900/50, zinc-800 borders, violet accents)

#### `components/social/FollowButton.tsx`
- Toggle follow/unfollow via API
- Shows follower count
- "Follow" (outline) / "Following ✓" (filled violet)
- Requires auth (redirects to /login if not logged in)
- Hides button if viewing own profile
- Real-time count updates

#### `components/social/ContentBadges.tsx`
- **CollabBadge**: 🤝 Collab (violet badge)
- **RemixBadge**: 🔄 Remix (cyan badge with optional original title tooltip)
- Integrated into VideoCard component

### 3. API Routes

#### `app/api/social/comments/route.ts`
- **GET**: Fetch comments with author profiles, nested replies
  - Query: `?video_id=xxx&limit=20&offset=0`
  - Returns comments with user info and replies
- **POST**: Create comment
  - Body: `{ video_id, body, timestamp_ms?, parent_id? }`
  - Validates comment length (max 500 chars)
  - Returns comment with author profile
- **DELETE**: Delete own comment
  - Query: `?comment_id=xxx`
  - Verifies ownership via user_id

#### `app/api/social/follow/route.ts`
- **GET**: Check follow status
  - Query: `?target_user_id=xxx&current_user_id=xxx`
  - Returns `{ isFollowing: boolean }`
- **POST**: Follow user
  - Body: `{ target_user_id }`
  - Auto-increments follower_count via trigger
- **DELETE**: Unfollow user
  - Body: `{ target_user_id }`
  - Auto-decrements counts via trigger

#### `app/api/social/profile/route.ts`
- **GET**: Fetch profile by username or user_id
- **POST**: Create new profile (signup flow)
- **PUT**: Update profile bio/display_name

### 4. Creator Profile Pages (`app/creators/[username]/page.tsx`)
- **Header**: Avatar (initials), display_name, @username, bio, follower/following counts
- **Follow Button**: Integrated with real-time updates
- **Bio Edit**: If viewing own profile
- **Tabs**: Videos | Collaborations | Remixes
- **Video Grid**: Filtered by video type (is_collab, is_remix)
- **404 Handling**: If creator not found

### 5. Integration Points

#### Watch Page (`app/watch/[id]/page.tsx`)
- Comments component added below embed section
- Imports Comments from `components/social/Comments`

#### Video Card (`components/VideoCard.tsx`)
- Shows collab and remix badges below channel badge
- Integrated ContentBadges component

#### Register Page (`app/register/page.tsx`)
- Creates profile during signup with username from slug
- Ties auth.users → profiles table

## Database Schema

### profiles
```sql
id (UUID) - references auth.users(id)
display_name (TEXT)
username (TEXT, UNIQUE)
bio (TEXT, nullable)
avatar_url (TEXT, nullable)
follower_count (INTEGER, default 0)
following_count (INTEGER, default 0)
created_at (TIMESTAMPTZ)
```

### comments
```sql
id (UUID)
video_id (UUID) - references videos(id)
user_id (UUID) - references profiles(id)
body (TEXT, max 500 chars)
timestamp_ms (INTEGER, nullable) - for timed comments
parent_id (UUID, nullable) - for replies
created_at (TIMESTAMPTZ)
```

### follows
```sql
follower_id (UUID) - references profiles(id)
following_id (UUID) - references profiles(id)
created_at (TIMESTAMPTZ)
PRIMARY KEY (follower_id, following_id)
```

### collaborations
```sql
id (UUID)
video_id (UUID) - references videos(id)
creator_id (UUID) - references profiles(id)
role (TEXT) - 'creator', 'collaborator', 'remixer'
agnt_share (INTEGER) - percentage share
created_at (TIMESTAMPTZ)
```

## Manual Setup Required

### 1. Run Database Migration
Execute `supabase/migration_social.sql` in your Supabase SQL editor:
```bash
# Via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of migration_social.sql
# 3. Click "Execute"
```

### 2. Update Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Add Auth Middleware (Optional but Recommended)
Create middleware to attach `x-user-id` header to API requests:
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function middleware(req: NextRequest) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  const requestHeaders = new Headers(req.headers);
  if (user?.id) {
    requestHeaders.set('x-user-id', user.id);
  }
  
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/social/:path*'],
};
```

## Type Additions

Added to `lib/types.ts`:
- `Profile` interface
- `Comment` interface  
- `Follow` interface
- `Collaboration` interface
- Extended `Video` with social fields

## Usage Examples

### Comments Component
```tsx
<Comments videoId={video.id} currentTimeMs={playerTime} onSeek={handleSeek} />
```

### Follow Button
```tsx
<FollowButton targetUserId={creator.id} initialFollowerCount={creator.follower_count} />
```

### Badges
```tsx
{video.is_collab && <CollabBadge />}
{video.is_remix && <RemixBadge originalTitle="Original Video" />}
```

## Known Limitations & TODOs

1. **Auth Middleware**: API routes currently check `x-user-id` header manually. Add proper middleware for production.
2. **Notifications**: No comment/follow notification system yet.
3. **Search**: No full-text search for users/creators.
4. **DMs**: No direct messaging feature.
5. **Trending**: No trending creators/videos algorithm.
6. **Rate Limiting**: Comments API should have rate limiting.
7. **Comment Moderation**: No spam detection or comment filtering.
8. **Avatar Upload**: Profiles don't have image uploads yet.

## Testing Checklist

- [ ] Database migration runs without errors
- [ ] Can register new user (creates profile)
- [ ] Can view creator profile page
- [ ] Can follow/unfollow users
- [ ] Follower count updates in real-time
- [ ] Can post comments on videos
- [ ] Can reply to comments
- [ ] Comments show with author info
- [ ] Can delete own comments
- [ ] Collab/Remix badges appear on videos
- [ ] Pagination loads more comments

## File Structure
```
agentictv/
├── supabase/
│   └── migration_social.sql
├── components/
│   └── social/
│       ├── Comments.tsx
│       ├── FollowButton.tsx
│       └── ContentBadges.tsx
├── app/
│   ├── api/social/
│   │   ├── comments/route.ts
│   │   ├── follow/route.ts
│   │   └── profile/route.ts
│   ├── creators/[username]/page.tsx
│   └── watch/[id]/page.tsx (updated)
└── lib/types.ts (updated)
```

## Git Commit
All changes committed to main:
```
Social layer: comments, follow/following, collab/remix badges, creator profiles
```

## Next Steps
1. Run the database migration
2. Optionally add auth middleware for cleaner API handling
3. Test all components thoroughly
4. Add notifications system (optional)
5. Implement creator search/discovery
