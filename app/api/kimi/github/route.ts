/**
 * Kimi Portal v2 — GitHub API Route
 * POST /api/kimi/github — Execute GitHub operations
 *
 * Supports: create_branch, open_pr, list_branches
 * Does NOT support: merge (protected branches are off-limits)
 */

import { createBranch, openPR, listBranches } from '../../../../lib/kimi/kimi.github';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerAgent = 'kimi', sessionId, ...params } = body;

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Explicitly reject merge operations
    if (action === 'merge') {
      return Response.json(
        { error: 'DENIED: Kimi cannot merge to protected branches. Use PR workflow.' },
        { status: 403 },
      );
    }

    switch (action) {
      case 'create_branch': {
        const { branchName, baseBranch, repo } = params;
        if (!branchName) {
          return Response.json({ error: 'branchName is required' }, { status: 400 });
        }
        const result = await createBranch({ callerAgent, sessionId, branchName, baseBranch, repo });
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 400 });
        }
        return Response.json(result.data);
      }

      case 'open_pr': {
        const { title, prBody, head, base, repo } = params;
        if (!title || !head) {
          return Response.json({ error: 'title and head are required' }, { status: 400 });
        }
        const result = await openPR({ callerAgent, sessionId, title, body: prBody || '', head, base, repo });
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 400 });
        }
        return Response.json(result.data);
      }

      case 'list_branches': {
        const { repo } = params;
        const result = await listBranches(callerAgent, repo);
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 400 });
        }
        return Response.json({ branches: result.data });
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Supported: create_branch, open_pr, list_branches` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[Kimi GitHub] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'GitHub operation failed' },
      { status: 500 },
    );
  }
}
