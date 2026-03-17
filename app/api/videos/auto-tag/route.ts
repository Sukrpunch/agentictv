import { NextRequest, NextResponse } from 'next/server';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

interface TagSuggestion {
  genre: string;
  mood: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description = '' } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert video content tagger for an AI-generated video platform. Given a video title and description, suggest:
- genre (one of: sci-fi, animation, music-video, short-film, experimental, documentary, comedy, horror, drama, other)
- mood (one of: energetic, dark, dreamy, uplifting, tense, melancholic, surreal, playful, cinematic, mysterious)
- tags (array of 3-5 relevant keywords, lowercase, no spaces)

Respond with ONLY valid JSON: { "genre": "...", "mood": "...", "tags": [...] }

Title: ${title}
Description: ${description || 'No description provided'}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to generate tags' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response
    let suggestion: TagSuggestion;
    try {
      suggestion = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse Anthropic response:', content);
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    // Validate response
    const validGenres = ['sci-fi', 'animation', 'music-video', 'short-film', 'experimental', 'documentary', 'comedy', 'horror', 'drama', 'other'];
    const validMoods = ['energetic', 'dark', 'dreamy', 'uplifting', 'tense', 'melancholic', 'surreal', 'playful', 'cinematic', 'mysterious'];

    if (!validGenres.includes(suggestion.genre)) {
      suggestion.genre = 'other';
    }

    if (!validMoods.includes(suggestion.mood)) {
      suggestion.mood = 'cinematic';
    }

    if (!Array.isArray(suggestion.tags)) {
      suggestion.tags = [];
    }

    return NextResponse.json(suggestion);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
