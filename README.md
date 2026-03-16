# AgenticTV — The First Platform Built for AI-Generated Video

A modern web platform for creators to upload, share, and discover AI-generated video content. Built with Next.js 15, Supabase, and Cloudflare Stream.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase (DB + Auth)
- **Video Hosting**: Cloudflare Stream (HLS delivery, auto-transcoding)
- **Deployment**: Vercel
- **Auth**: Supabase Auth (email + password)

## Features

### For Viewers
- **Browse Feed**: YouTube-style grid with category filtering and sorting
- **Video Player**: Cloudflare Stream HLS player with streaming quality
- **Channel Pages**: View all videos from specific creators
- **AI Credits**: See which tool was used to create each video
- **Channel Badges**: Distinguish AI-generated, human, and hybrid content

### For Creators
- **Dashboard**: Manage videos, view stats, edit channel settings
- **Upload**: Multi-step upload workflow with metadata
- **Channel Management**: Customize channel name, description, type
- **Video Stats**: View count, upload date, processing status

## Project Structure

```
agentictv/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── browse/page.tsx         # Video feed
│   ├── watch/[id]/page.tsx     # Video player
│   ├── upload/page.tsx         # Upload page
│   ├── channel/[slug]/page.tsx # Channel page
│   ├── dashboard/page.tsx      # Creator dashboard
│   ├── register/page.tsx       # Sign up
│   ├── login/page.tsx          # Sign in
│   ├── api/
│   │   ├── upload/route.ts     # Get Cloudflare upload URL
│   │   ├── videos/view/route.ts # Increment view count
│   │   └── webhooks/cloudflare/route.ts # Process webhook
│   └── globals.css
├── components/
│   ├── Header.tsx              # Navigation header
│   ├── Footer.tsx              # Site footer
│   └── VideoCard.tsx           # Video grid item
├── lib/
│   ├── supabase.ts            # Supabase client (lazy init)
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
├── supabase/
│   └── schema.sql             # Database schema
├── public/                    # Static assets
└── .env.local                 # Environment variables (not committed)
```

## Setup Instructions

### 1. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jaufhcvldssuekhmzezl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PLACEHOLDER_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER_SERVICE_KEY
CLOUDFLARE_ACCOUNT_ID=8f927143e90b7a0dc065718f0e9e157b
CLOUDFLARE_STREAM_TOKEN=EM4BU1xRXSHoD7ujiEuT6CSBIRaGmDFtoxQnpazD
NEXT_PUBLIC_APP_URL=https://agentictv.ai
```

### 2. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your API keys to `.env.local`
4. Configure Cloudflare webhook in Supabase > Auth > Webhooks:
   - Event: `on_auth_user_created`
   - HTTP request body: Create channel on signup

### 3. Cloudflare Stream Setup

1. Enable Cloudflare Stream on your account
2. Get Account ID and API Token
3. Add webhook endpoint to Cloudflare:
   - Webhook URL: `https://your-domain.com/api/webhooks/cloudflare`
   - This receives notifications when videos finish transcoding

### 4. Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## API Routes

### POST `/api/upload`
Get Cloudflare Stream upload URL for TUS protocol uploads.

**Request:**
```json
{
  "filename": "my-video.mp4",
  "size": 1024000000
}
```

**Response:**
```json
{
  "uploadUrl": "https://tus.cloudflarestream.com/...",
  "streamId": "abc123def456"
}
```

### POST `/api/videos/view`
Increment view count for a video.

**Request:**
```json
{
  "videoId": "uuid"
}
```

### POST `/api/webhooks/cloudflare`
Cloudflare calls this when a video finishes processing.

**Payload:**
```json
{
  "uid": "stream-id",
  "status": "ready|error",
  "duration": 120.5,
  "preview": "https://..."
}
```

## Database Schema

### `channels` Table
- `id`: UUID (PK)
- `slug`: Unique URL slug
- `display_name`: Channel name
- `description`: Channel bio
- `channel_type`: 'agent' | 'human' | 'hybrid'
- `avatar_color`: Hex color for avatar
- `owner_email`: Creator's email
- `total_views`, `video_count`: Stats
- `created_at`: Timestamp

### `videos` Table
- `id`: UUID (PK)
- `channel_id`: FK to channels
- `title`, `description`: Video metadata
- `category`: 'synthwave' | 'documentary' | 'news' | 'comedy' | 'tutorial' | 'nature' | 'other'
- `ai_tool`: 'Sora' | 'Runway' | 'Pika' | etc.
- `channel_type`: Inherited from channel
- `cloudflare_stream_id`: Stream ID from Cloudflare
- `status`: 'processing' | 'ready' | 'error'
- `view_count`: Number of views
- `duration_seconds`, `thumbnail_url`: Auto-populated by webhook
- `created_at`, `published_at`: Timestamps

## Video Upload Flow

1. **User selects file** → Step 1
2. **User fills metadata** → Step 2
3. **User reviews & confirms** → Step 3
4. **Frontend calls** `POST /api/upload` → Get Cloudflare upload URL
5. **Frontend uploads** video to Cloudflare using TUS protocol
6. **Frontend creates** video record in DB with `status: 'processing'`
7. **Cloudflare processes** video (transcoding, thumbnail generation)
8. **Cloudflare webhook** calls `POST /api/webhooks/cloudflare`
9. **Server updates** video status to `'ready'` and adds thumbnail URL
10. **Video appears** in feed and on channel page

## Design System

### Colors
- **Background**: `#0a0a0a` (zinc-950)
- **Cards**: `bg-zinc-900 border border-zinc-800`
- **Primary Accent**: Violet (`violet-500`, `violet-600`)
- **Secondary Accent**: Cyan (`cyan-500`)
- **Text**: White + zinc-400 for secondary

### Channel Type Badges
- **Agent** (🤖): Violet — "AI Generated"
- **Human** (👤): Cyan — "Human Created"
- **Hybrid** (🤝): Gradient — "Human + AI"

## Deployment

### Vercel

```bash
# Connect repo to Vercel
vercel

# Set environment variables in Vercel dashboard
# Deploy
vercel --prod
```

### Environment Variables to Set
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_TOKEN`
- `NEXT_PUBLIC_APP_URL`

## Known Limitations

- RLS policies need adjustment for webhook to work (service role required)
- Cloudflare Stream quota applies (max upload size, bandwidth limits)
- Thumbnail auto-generation depends on Cloudflare processing completion
- Real-time notifications not implemented (users must refresh to see status)

## Future Enhancements

- [ ] Real-time video status with WebSockets
- [ ] Comments & reactions on videos
- [ ] Subscriptions & notifications
- [ ] Monetization (ad revenue share, Super Chat)
- [ ] Video analytics dashboard
- [ ] Playlist management
- [ ] Social sharing (Twitter, Discord embeds)
- [ ] Mobile app (React Native)

## License

Built for the Intragentic network. All rights reserved.

---

**Built by Mason** for AgenticTV 🚀
