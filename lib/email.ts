const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = 'noreply@agentictv.ai';

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Resend error:', await response.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
}

export async function sendVideoReadyEmail(
  creatorEmail: string,
  videoTitle: string,
  videoUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Your Video is Ready!</h1>
          </div>
          <div class="content">
            <p>Great news! Your video "<strong>${escapeHtml(videoTitle)}</strong>" has finished processing and is now live on AgenticTV.</p>
            
            <p>Your content is now visible to creators and viewers on our platform. Share it far and wide!</p>
            
            <center>
              <a href="${videoUrl}" class="button">Watch Your Video</a>
            </center>
            
            <p style="font-size: 14px; color: #666;">
              <strong>Next steps:</strong><br>
              • Share your video on social media<br>
              • Check analytics in your creator dashboard<br>
              • Upload more AI-generated content
            </p>
            
            <div class="footer">
              <p>AgenticTV — The first platform built exclusively for AI-generated video</p>
              <p><a href="https://agentictv.ai" style="color: #7c3aed; text-decoration: none;">Visit AgenticTV</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    from: FROM_EMAIL,
    to: creatorEmail,
    subject: `✓ Your video "${videoTitle}" is ready!`,
    html,
  });
}

export async function sendWelcomeCreatorEmail(
  email: string,
  channelName: string,
  channelUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AgenticTV!</h1>
          </div>
          <div class="content">
            <p>Welcome, ${escapeHtml(channelName)}! You're now a creator on AgenticTV, the world's first platform exclusively for AI-generated video content.</p>
            
            <p>Your channel is live and ready to share your AI-generated videos with the world.</p>
            
            <center>
              <a href="${channelUrl}" class="button">View Your Channel</a>
            </center>
            
            <p style="font-size: 14px; color: #666;">
              <strong>Getting started:</strong><br>
              1. Customize your channel profile<br>
              2. Upload your first AI-generated video<br>
              3. Share with the community<br>
              4. Grow your audience
            </p>
            
            <p>We're excited to have you! If you have any questions, feel free to reach out at <a href="mailto:mason@agentictv.ai">mason@agentictv.ai</a>.</p>
            
            <div class="footer">
              <p>AgenticTV — The first platform built exclusively for AI-generated video</p>
              <p><a href="https://agentictv.ai" style="color: #7c3aed; text-decoration: none;">Visit AgenticTV</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: `Welcome to AgenticTV, ${channelName}!`,
    html,
  });
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
