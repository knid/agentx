import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/index';
import { telemetry, agents } from '@/lib/db/schema';
import { rateLimit, getDefaultLimiter } from '@/lib/utils/rate-limit';
import { eq, and } from 'drizzle-orm';

const telemetryEventSchema = z.object({
  agent: z.string().min(1).max(200),
  version: z.string().max(50).optional(),
  success: z.boolean(),
  duration_ms: z.number().int().min(0).max(3_600_000),
  error_type: z.string().max(100).optional(),
});

/**
 * POST /api/v1/telemetry
 *
 * Accepts anonymous telemetry events from the CLI.
 * Rate-limited by IP to prevent abuse.
 */
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
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

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = telemetryEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid telemetry event', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const event = parsed.data;

  // Resolve agent_id from the scoped name (e.g. "@agentx/gmail-agent" -> scope="agentx", name="gmail-agent")
  let agentId: string | null = null;
  const scopeMatch = event.agent.match(/^@([^/]+)\/(.+)$/);
  if (scopeMatch) {
    const [, scope, name] = scopeMatch;
    const found = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.scope, scope!), eq(agents.name, name!)))
      .limit(1);

    if (found.length > 0) {
      agentId = found[0]!.id;
    }
  }

  // Insert telemetry event
  await db.insert(telemetry).values({
    agentId,
    version: event.version ?? null,
    success: event.success,
    durationMs: event.duration_ms,
    errorType: event.error_type ?? null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
