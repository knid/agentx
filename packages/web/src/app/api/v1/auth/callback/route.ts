import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { exchangeCodeForToken, getUserProfile, generateAgentxToken } from '@/lib/auth/github';
import { rateLimit, getDefaultLimiter } from '@/lib/utils/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const rl = await rateLimit(ip, getDefaultLimiter());

    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(rl.reset),
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required query parameters: code, state' },
        { status: 400 },
      );
    }

    // Exchange authorization code for GitHub access token
    const githubToken = await exchangeCodeForToken(code);

    // Fetch user profile from GitHub
    const profile = await getUserProfile(githubToken);

    // Generate agentx token
    const agentxToken = generateAgentxToken();

    // Upsert user in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.githubId, profile.github_id))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          username: profile.username,
          displayName: profile.display_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          updatedAt: new Date(),
        })
        .where(eq(users.githubId, profile.github_id));
    } else {
      // Create new user
      await db.insert(users).values({
        githubId: profile.github_id,
        username: profile.username,
        displayName: profile.display_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
      });
    }

    return NextResponse.json(
      {
        token: agentxToken,
        user: {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          github_id: profile.github_id,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      },
    );
  } catch (error) {
    console.error('GET /api/v1/auth/callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
