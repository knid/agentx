import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getGitHubAuthUrl } from '@/lib/auth/github';
import { rateLimit, getDefaultLimiter } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as { redirect_uri?: string; state?: string };

    if (!body.redirect_uri) {
      return NextResponse.json(
        { error: 'Missing required field: redirect_uri' },
        { status: 400 },
      );
    }

    const state = body.state ?? randomBytes(16).toString('hex');
    const authUrl = getGitHubAuthUrl(body.redirect_uri, state);

    return NextResponse.json(
      { auth_url: authUrl, state },
      {
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      },
    );
  } catch (error) {
    console.error('POST /api/v1/auth/github error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
