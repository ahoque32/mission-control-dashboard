/**
 * Kimi Portal — Memory API Route
 * GET  /api/kimi/memory — Read Kimi's local memory
 * POST /api/kimi/memory — Write to Kimi's local memory
 */

import { loadJHawkProfile, loadKimiMemory } from '../../../../lib/kimi/chiefOperator.controller';
import type { KimiMemoryWriteRequest } from '../../../../lib/kimi/kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

const VALID_CATEGORIES = [
  'working_notes',
  'task_state',
  'decisions',
  'drafts',
  'observations',
  'escalation_history',
];

export async function GET() {
  try {
    const [memory, profile] = await Promise.all([
      loadKimiMemory(),
      loadJHawkProfile(),
    ]);

    return Response.json({
      entries: memory.map((m) => ({
        key: m.key,
        value: m.value,
        category: m.category,
      })),
      profileVersion: profile.version,
    });
  } catch (error) {
    console.error('[Kimi] Memory read error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to read memory' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KimiMemoryWriteRequest;
    const { key, value, category } = body;

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return Response.json({ error: 'key is required' }, { status: 400 });
    }

    if (!value || typeof value !== 'string') {
      return Response.json({ error: 'value is required' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return Response.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!CONVEX_URL) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Write to Convex
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'kimiMemory:upsert',
        args: {
          key: key.trim(),
          value,
          category,
        },
        format: 'json',
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[Kimi] Memory write failed:', res.status, errorBody);
      return Response.json({ error: 'Failed to write memory' }, { status: 500 });
    }

    // Log activity
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'activities:create',
          args: {
            type: 'kimi_memory_write',
            agentId: 'kimi',
            taskId: null,
            message: `Kimi updated local memory: ${key.trim()}`,
            metadata: {
              key: key.trim(),
              category,
              agentName: 'Kimi',
            },
          },
          format: 'json',
        }),
      });
    } catch (logError) {
      console.error('[Kimi] Failed to log memory write:', logError);
    }

    return Response.json({
      success: true,
      key: key.trim(),
      category,
    });
  } catch (error) {
    console.error('[Kimi] Memory write error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
