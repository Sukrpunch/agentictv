import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:mason@bessjobs.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subs, error: queryError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (queryError || !subs?.length) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const payloadStr = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payloadStr
          )
          .catch(async (err) => {
            // Clean up invalid subscriptions (410 Gone, 404 Not Found)
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log(`Removing invalid subscription: ${sub.endpoint}`);
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            }
            throw err;
          })
      )
    );

    // Log results for debugging
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(
      `Push notifications sent to user ${userId}: ${succeeded} succeeded, ${failed} failed`
    );
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}
