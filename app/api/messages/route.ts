import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push/sendPush';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get conversations where user is participant
    const { data: conversations, error: queryError } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1_profile:participant_1(display_name, username, avatar_url),
        participant_2_profile:participant_2(display_name, username, avatar_url)
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Get last message for each conversation
    const conversationsWithLastMsg = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('body, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for this conversation
        const isP1 = conv.participant_1 === user.id;
        const unreadCount = isP1 ? conv.unread_1 : conv.unread_2;

        return {
          ...conv,
          lastMessage: lastMsg,
          unreadCount,
          otherParticipant: isP1 ? conv.participant_2_profile : conv.participant_1_profile,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithLastMsg,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { recipient_id, body: messageBody } = body;

    if (!recipient_id || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (messageBody.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Sort participant IDs to ensure consistent conversation storage
    const [p1, p2] = [user.id, recipient_id].sort();

    // Upsert conversation (will create if not exists)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert({
        participant_1: p1,
        participant_2: p2,
        last_message_at: new Date().toISOString(),
      }, {
        onConflict: 'participant_1,participant_2',
      })
      .select()
      .single();

    if (convError) {
      console.error('Conversation error:', convError);
      return NextResponse.json(
        { error: 'Failed to create/get conversation' },
        { status: 500 }
      );
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: messageBody,
      })
      .select()
      .single();

    if (msgError) {
      console.error('Message error:', msgError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Update unread count for recipient
    const isRecipientP1 = recipient_id === conversation.participant_1;
    const updateField = isRecipientP1 ? 'unread_1' : 'unread_2';
    
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        [updateField]: conversation[updateField] + 1,
      })
      .eq('id', conversation.id);

    // Create notification for recipient
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    await supabase
      .from('notifications')
      .insert({
        user_id: recipient_id,
        actor_id: user.id,
        type: 'comment',
        entity_id: conversation.id,
        entity_type: 'message',
        message: (senderProfile?.display_name || 'Someone') + ' sent you a message',
      });

    // Send push notification
    await sendPushToUser(recipient_id, {
      title: 'AgenticTV',
      body: (senderProfile?.display_name || 'Someone') + ' sent you a message',
      url: `/messages/${conversation.id}`,
    });

    return NextResponse.json({
      message,
      conversation,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
