/**
 * Kimi Portal — Code API Route (Ralph Mode)
 * POST /api/kimi/code
 *
 * Executes coding tasks: implement, review, refactor.
 * Streams progress via SSE. Creates branches and opens PRs via GitHub API.
 */

import { executeCodingTask } from '../../../../lib/kimi/kimi.coding';
import type { CodingAction } from '../../../../lib/kimi/kimi.coding';

const VALID_ACTIONS: CodingAction[] = ['implement', 'review', 'refactor'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      task,
      repo,
      branch,
      files,
      targetPath,
      sessionId = `code-${Date.now()}`,
    } = body;

    // ── Validation ──────────────────────────────────────────────────────

    if (!action || !VALID_ACTIONS.includes(action)) {
      return Response.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      return Response.json({ error: 'task is required' }, { status: 400 });
    }

    if (!repo || typeof repo !== 'string') {
      return Response.json({ error: 'repo is required (e.g. "mission-control-dashboard" or "ahoque32/mission-control-dashboard")' }, { status: 400 });
    }

    // Check required env vars
    if (!process.env.MOONSHOT_API_KEY) {
      return Response.json({ error: 'MOONSHOT_API_KEY not configured' }, { status: 500 });
    }

    if (!process.env.GITHUB_TOKEN) {
      return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
    }

    // ── SSE Stream ──────────────────────────────────────────────────────

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: { type: string; [key: string]: unknown }) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }

        // Send initial event
        sendEvent({
          type: 'start',
          action,
          repo,
          task: task.slice(0, 200),
          timestamp: Date.now(),
        });

        try {
          const result = await executeCodingTask(
            {
              action,
              task: task.trim(),
              repo,
              branch,
              files,
              targetPath,
              callerAgent: 'kimi',
              sessionId,
            },
            // Progress callback — forward to SSE stream
            (progress) => {
              sendEvent({
                type: 'progress',
                progressType: progress.type,
                message: progress.message,
                timestamp: Date.now(),
              });
            },
          );

          // Send result
          sendEvent({
            type: 'result',
            ...result,
            timestamp: Date.now(),
          });
        } catch (error) {
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unexpected error',
            timestamp: Date.now(),
          });
        }

        // Signal done
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Kimi Code] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
