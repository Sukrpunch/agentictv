import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { awardAGNT, AGNT_REWARDS } from '@/lib/agnt'

async function sendCreatorApplicationEmail(
  name: string,
  email: string
): Promise<boolean> {
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
          ul { margin: 15px 0; padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're on the list. 🎬</h1>
          </div>
          <div class="content">
            <p>Hey ${escapeHtml(name)},</p>
            <p>Your Founding Creator application for AgenticTV has been received. We review within 48 hours.</p>
            
            <ul>
              <li>We'll review your application and sample work</li>
              <li>Approval email with next steps coming soon</li>
              <li>Once approved, upload your first video and your channel goes live</li>
            </ul>
            
            <p><strong>Founding Creator perks:</strong> 70% revenue share forever + 500 $AGNT signup bonus (coming soon).</p>
            <p>Only 100 spots. You're early.</p>
            
            <div class="footer">
              <p>— The AgenticTV Team</p>
              <p>AgenticTV — The first platform built exclusively for AI-generated video</p>
              <p><a href="https://agentictv.ai" style="color: #7c3aed; text-decoration: none;">Visit AgenticTV</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@agentictv.ai',
        to: email,
        subject: 'Your Founding Creator application is received 🎬',
        html,
      }),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, email, tools, content_type, sample_url, acknowledges_terms } = body

    // Validate required fields
    if (!name || !email || !tools || !content_type || !acknowledges_terms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Insert into creator_applications table
    const { data, error } = await supabase
      .from('creator_applications')
      .insert([
        {
          name,
          email,
          platform: 'agentictv',
          tools,
          content_type,
          sample_url: sample_url || null,
          status: 'pending',
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      )
    }

    // Send auto-response email (wrap in try/catch - don't break response if it fails)
    try {
      await sendCreatorApplicationEmail(name, email);
    } catch (emailErr) {
      console.error('Failed to send auto-response email:', emailErr);
      // Don't return error - email failure should not break the API response
    }

    // Log the founding creator bonus (user_id will be null, email stored in reason)
    try {
      await awardAGNT(
        null,
        AGNT_REWARDS.FOUNDING_CREATOR,
        `Founding Creator signup bonus reserved for ${email}`
      );
    } catch (agntErr) {
      console.error('Failed to log AGNT bonus:', agntErr);
      // Don't return error - AGNT logging failure should not break the API response
    }

    return NextResponse.json({
      success: true,
      message: 'Application received! We\'ll review within 48 hours.',
      data,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
