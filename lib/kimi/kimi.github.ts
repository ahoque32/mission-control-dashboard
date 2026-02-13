/**
 * Kimi Portal v2 — GitHub Integration
 *
 * Provides controlled GitHub access for Kimi:
 * - Read repos
 * - Create branches
 * - Commit & push
 * - Open PRs
 *
 * NO direct merges to protected branches.
 * All actions are logged to the activity feed.
 */

import { checkPermission } from './kimi.permissions';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_OWNER = 'ahoque32';
const DEFAULT_REPO = 'mission-control-dashboard';

// ── Types ───────────────────────────────────────────────────────────────────

export interface GitHubBranchRequest {
  callerAgent: string;
  sessionId: string;
  branchName: string;
  baseBranch?: string;
  repo?: string;
}

export interface GitHubPRRequest {
  callerAgent: string;
  sessionId: string;
  title: string;
  body: string;
  head: string;
  base?: string;
  repo?: string;
}

interface GitHubResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function githubAPI(
  endpoint: string,
  method: string = 'GET',
  body?: unknown,
): Promise<Response> {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');

  return fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function logActivity(
  type: string,
  message: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!CONVEX_URL) return;

  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'activities:create',
        args: {
          type,
          agentId: 'kimi',
          taskId: null,
          message,
          metadata: { ...metadata, agentName: 'Kimi' },
        },
        format: 'json',
      }),
    });
  } catch (error) {
    console.error('[Kimi GitHub] Failed to log activity:', error);
  }
}

// ── GitHub Operations ───────────────────────────────────────────────────────

/**
 * Create a new branch from a base branch.
 */
export async function createBranch(
  request: GitHubBranchRequest,
): Promise<GitHubResponse<{ ref: string; sha: string }>> {
  // Permission check
  const perm = checkPermission(request.callerAgent, 'create_branch');
  if (!perm.allowed) {
    await logActivity('kimi_permission_denied', perm.reason, {
      action: 'create_branch',
      sessionId: request.sessionId,
    });
    return { success: false, error: perm.reason };
  }

  const repo = request.repo || `${DEFAULT_OWNER}/${DEFAULT_REPO}`;
  const baseBranch = request.baseBranch || 'main';

  try {
    // Get base branch SHA
    const baseRef = await githubAPI(`/repos/${repo}/git/ref/heads/${baseBranch}`);
    if (!baseRef.ok) {
      return { success: false, error: `Base branch "${baseBranch}" not found` };
    }
    const baseData = await baseRef.json();
    const sha = baseData.object.sha;

    // Create new branch
    const res = await githubAPI(`/repos/${repo}/git/refs`, 'POST', {
      ref: `refs/heads/${request.branchName}`,
      sha,
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Failed to create branch: ${errBody}` };
    }

    const data = await res.json();

    await logActivity('kimi_github_branch', `Created branch: ${request.branchName}`, {
      repo,
      branch: request.branchName,
      baseBranch,
      sha,
      sessionId: request.sessionId,
    });

    return { success: true, data: { ref: data.ref, sha } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Open a Pull Request.
 * Kimi can open PRs but CANNOT merge to protected branches.
 */
export async function openPR(
  request: GitHubPRRequest,
): Promise<GitHubResponse<{ number: number; url: string }>> {
  // Permission check
  const perm = checkPermission(request.callerAgent, 'open_pr');
  if (!perm.allowed) {
    await logActivity('kimi_permission_denied', perm.reason, {
      action: 'open_pr',
      sessionId: request.sessionId,
    });
    return { success: false, error: perm.reason };
  }

  const repo = request.repo || `${DEFAULT_OWNER}/${DEFAULT_REPO}`;
  const base = request.base || 'main';

  try {
    const res = await githubAPI(`/repos/${repo}/pulls`, 'POST', {
      title: request.title,
      body: request.body,
      head: request.head,
      base,
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Failed to create PR: ${errBody}` };
    }

    const data = await res.json();

    await logActivity('kimi_github_pr', `Opened PR #${data.number}: ${request.title}`, {
      repo,
      prNumber: data.number,
      prUrl: data.html_url,
      head: request.head,
      base,
      sessionId: request.sessionId,
    });

    return { success: true, data: { number: data.number, url: data.html_url } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * List repository branches.
 */
export async function listBranches(
  callerAgent: string,
  repo?: string,
): Promise<GitHubResponse<Array<{ name: string; sha: string }>>> {
  const perm = checkPermission(callerAgent, 'read_all_data');
  if (!perm.allowed) {
    return { success: false, error: perm.reason };
  }

  const repoPath = repo || `${DEFAULT_OWNER}/${DEFAULT_REPO}`;

  try {
    const res = await githubAPI(`/repos/${repoPath}/branches?per_page=30`);
    if (!res.ok) {
      return { success: false, error: `Failed to list branches: ${res.status}` };
    }

    const data = await res.json();
    const branches = data.map((b: { name: string; commit: { sha: string } }) => ({
      name: b.name,
      sha: b.commit.sha,
    }));

    return { success: true, data: branches };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
