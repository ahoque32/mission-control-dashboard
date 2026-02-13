/**
 * Kimi Portal — Coding Service (Ralph Mode)
 *
 * Provides coding capabilities powered by Kimi K2.5 with Ralph's protocols.
 * Reads/writes files via GitHub API, creates branches, and opens PRs.
 *
 * All actions are logged to Convex for audit trail.
 */

import { kimiChat, parseKimiStream } from './kimi.service';
import {
  readFile,
  createOrUpdateFile,
  listFiles,
  createBranch,
  openPR,
} from './kimi.github';
import type { KimiChatMessage } from './kimi.types';

// ── Types ───────────────────────────────────────────────────────────────────

export type CodingAction = 'implement' | 'review' | 'refactor';

export interface CodingRequest {
  action: CodingAction;
  task: string;
  repo: string;
  branch?: string;
  files?: string[];           // Specific files to read/focus on
  targetPath?: string;        // Where to write output
  callerAgent?: string;
  sessionId?: string;
}

export interface CodingFileChange {
  path: string;
  content: string;
  action: 'create' | 'update';
}

export interface CodingResult {
  success: boolean;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  filesChanged?: string[];
  reviewNotes?: string;
  error?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_OWNER = 'ahoque32';
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

const RALPH_CODING_PROMPT = `You are a senior developer operating in "Ralph Mode" — a coding assistant with strict quality standards.

## Code Principles
- Readable > Clever — code is read more than written
- Small functions, clear names, obvious flow
- Fail fast, fail loud — silent failures are the worst kind
- Comments explain WHY, code explains WHAT
- One change, one commit — keep history clean

## Testing Standards
- Every public function gets tested
- Edge cases aren't optional
- Mock external dependencies
- If it's hard to test, the design is wrong

## Output Format
When implementing code, respond with a JSON block containing file changes:

\`\`\`json
{
  "plan": "Brief explanation of approach",
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "full file content here",
      "action": "create | update"
    }
  ],
  "commitMessage": "type: concise description of changes",
  "prTitle": "Brief PR title",
  "prBody": "Markdown description of what changed and why"
}
\`\`\`

When reviewing code, respond with a JSON block:

\`\`\`json
{
  "summary": "Overall assessment",
  "issues": [
    { "severity": "error|warning|info", "file": "path", "line": "optional", "message": "description" }
  ],
  "suggestions": ["List of improvements"],
  "approved": true | false
}
\`\`\`

When refactoring, use the same format as implementing — provide the updated file contents.

IMPORTANT: Always include the full file content, not partial snippets. Respond ONLY with the JSON block — no other text.`;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parse owner/repo from a repo string (accepts "owner/repo" or just "repo") */
function parseRepo(repo: string): { owner: string; repoName: string } {
  if (repo.includes('/')) {
    const [owner, repoName] = repo.split('/');
    return { owner, repoName };
  }
  return { owner: DEFAULT_OWNER, repoName: repo };
}

/** Generate a branch name from task description */
function generateBranchName(action: CodingAction, task: string): string {
  const prefix = action === 'implement' ? 'feat' : action === 'refactor' ? 'refactor' : 'review';
  const slug = task
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const timestamp = Date.now().toString(36);
  return `kimi/${prefix}/${slug}-${timestamp}`;
}

/** Log coding activity to Convex */
async function logCodingActivity(
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
          metadata: { ...metadata, agentName: 'Kimi', mode: 'ralph' },
        },
        format: 'json',
      }),
    });
  } catch (error) {
    console.error('[Kimi Coding] Failed to log activity:', error);
  }
}

/** Read multiple files from GitHub and build context */
async function buildFileContext(
  owner: string,
  repo: string,
  paths: string[],
  branch?: string,
): Promise<string> {
  const parts: string[] = [];

  for (const filePath of paths) {
    const result = await readFile(owner, repo, filePath, branch);
    if (result.success && result.data) {
      parts.push(`### File: ${filePath}\n\`\`\`\n${result.data.content}\n\`\`\``);
    } else {
      parts.push(`### File: ${filePath}\n(Not found or error: ${result.error})`);
    }
  }

  return parts.join('\n\n');
}

/** Extract JSON from a potentially markdown-wrapped response */
function extractJSON(text: string): string {
  // Try to extract from ```json ... ``` blocks
  const jsonBlock = text.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlock) return jsonBlock[1].trim();

  // Try to extract raw JSON object
  const rawJson = text.match(/\{[\s\S]*\}/);
  if (rawJson) return rawJson[0].trim();

  return text.trim();
}

// ── Core Operations ─────────────────────────────────────────────────────────

/**
 * Execute a coding task: implementation, review, or refactor.
 * Streams progress via the onProgress callback.
 */
export async function executeCodingTask(
  request: CodingRequest,
  onProgress: (event: { type: string; message: string }) => void,
): Promise<CodingResult> {
  const { action, task, repo, branch, files = [], callerAgent = 'kimi', sessionId = 'coding' } = request;
  const { owner, repoName } = parseRepo(repo);
  const fullRepo = `${owner}/${repoName}`;

  onProgress({ type: 'status', message: `Starting ${action} task on ${fullRepo}...` });

  await logCodingActivity('kimi_coding_start', `Coding ${action}: ${task.slice(0, 100)}`, {
    action,
    repo: fullRepo,
    sessionId,
  });

  try {
    // Step 1: Read existing files for context
    onProgress({ type: 'status', message: 'Reading existing files for context...' });

    let fileContext = '';
    if (files.length > 0) {
      fileContext = await buildFileContext(owner, repoName, files, branch);
    }

    // If no files specified but target path exists, try to list the directory
    if (files.length === 0 && request.targetPath) {
      const dir = request.targetPath.split('/').slice(0, -1).join('/');
      if (dir) {
        const listing = await listFiles(owner, repoName, dir, branch);
        if (listing.success && listing.data) {
          fileContext = `### Directory listing: ${dir}\n${listing.data.map((f) => `- ${f.name} (${f.type})`).join('\n')}`;
        }
      }
    }

    // Step 2: Build the prompt for Kimi K2.5
    onProgress({ type: 'status', message: 'Generating code with Kimi K2.5...' });

    const userMessage = buildCodingUserMessage(action, task, fullRepo, fileContext);

    const messages: KimiChatMessage[] = [
      { role: 'system', content: RALPH_CODING_PROMPT },
      { role: 'user', content: userMessage },
    ];

    // Step 3: Call Kimi K2.5
    const response = await kimiChat({
      messages,
      stream: true,
      maxTokens: 8192,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Kimi API error: ${response.status} — ${errBody}`);
    }

    // Collect the full response
    let fullResponse = '';
    for await (const token of parseKimiStream(response)) {
      fullResponse += token;
    }

    onProgress({ type: 'status', message: 'Parsing AI response...' });

    // Step 4: Parse the response
    const jsonStr = extractJSON(fullResponse);
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return the raw response as review notes
      if (action === 'review') {
        return { success: true, reviewNotes: fullResponse };
      }
      throw new Error(`Failed to parse coding response as JSON. Raw: ${fullResponse.slice(0, 500)}`);
    }

    // Step 5: Handle review action (no file changes needed)
    if (action === 'review') {
      await logCodingActivity('kimi_coding_review', `Code review: ${task.slice(0, 100)}`, {
        repo: fullRepo,
        approved: parsed.approved,
        issueCount: Array.isArray(parsed.issues) ? parsed.issues.length : 0,
        sessionId,
      });

      return {
        success: true,
        reviewNotes: JSON.stringify(parsed, null, 2),
      };
    }

    // Step 6: For implement/refactor — create branch, write files, open PR
    const fileChanges = parsed.files as CodingFileChange[] | undefined;
    if (!fileChanges || fileChanges.length === 0) {
      throw new Error('No file changes in coding response');
    }

    const branchName = generateBranchName(action, task);
    onProgress({ type: 'status', message: `Creating branch: ${branchName}` });

    // Create branch
    const branchResult = await createBranch({
      callerAgent,
      sessionId,
      branchName,
      baseBranch: branch || 'main',
      repo: fullRepo,
    });

    if (!branchResult.success) {
      throw new Error(`Failed to create branch: ${branchResult.error}`);
    }

    // Write each file
    const changedFiles: string[] = [];
    for (const file of fileChanges) {
      onProgress({ type: 'status', message: `Writing: ${file.path}` });

      // Check if file exists (to get SHA for updates)
      let existingSha: string | undefined;
      if (file.action === 'update') {
        const existing = await readFile(owner, repoName, file.path, branchName);
        if (existing.success && existing.data) {
          existingSha = existing.data.sha;
        }
      }

      const writeResult = await createOrUpdateFile(
        owner,
        repoName,
        file.path,
        file.content,
        (parsed.commitMessage as string) || `${action}: ${file.path}`,
        branchName,
        existingSha,
      );

      if (!writeResult.success) {
        onProgress({ type: 'error', message: `Failed to write ${file.path}: ${writeResult.error}` });
        continue;
      }

      changedFiles.push(file.path);
    }

    if (changedFiles.length === 0) {
      throw new Error('No files were successfully written');
    }

    // Open PR
    onProgress({ type: 'status', message: 'Opening Pull Request...' });

    const prResult = await openPR({
      callerAgent,
      sessionId,
      title: (parsed.prTitle as string) || `[Kimi] ${action}: ${task.slice(0, 60)}`,
      body: (parsed.prBody as string) || `Automated ${action} by Kimi (Ralph Mode)\n\n**Task:** ${task}\n\n**Files changed:**\n${changedFiles.map((f) => `- ${f}`).join('\n')}`,
      head: branchName,
      base: branch || 'main',
      repo: fullRepo,
    });

    if (!prResult.success) {
      // Branch exists with changes but PR failed — still partially successful
      onProgress({ type: 'error', message: `PR creation failed: ${prResult.error}` });
      return {
        success: true,
        branchName,
        filesChanged: changedFiles,
        error: `Files committed to ${branchName} but PR creation failed: ${prResult.error}`,
      };
    }

    await logCodingActivity('kimi_coding_complete', `Coding ${action} complete: PR #${prResult.data!.number}`, {
      action,
      repo: fullRepo,
      branch: branchName,
      prNumber: prResult.data!.number,
      prUrl: prResult.data!.url,
      filesChanged: changedFiles,
      sessionId,
    });

    onProgress({ type: 'status', message: `✅ PR #${prResult.data!.number} opened successfully` });

    return {
      success: true,
      branchName,
      prUrl: prResult.data!.url,
      prNumber: prResult.data!.number,
      filesChanged: changedFiles,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';

    await logCodingActivity('kimi_coding_error', `Coding ${action} failed: ${msg.slice(0, 200)}`, {
      action,
      repo: fullRepo,
      error: msg,
      sessionId,
    });

    onProgress({ type: 'error', message: msg });

    return { success: false, error: msg };
  }
}

// ── Prompt Builders ─────────────────────────────────────────────────────────

function buildCodingUserMessage(
  action: CodingAction,
  task: string,
  repo: string,
  fileContext: string,
): string {
  const parts: string[] = [];

  parts.push(`## Task: ${action.toUpperCase()}`);
  parts.push(`**Repository:** ${repo}`);
  parts.push(`**Description:** ${task}`);

  if (fileContext) {
    parts.push(`\n## Existing Code Context\n${fileContext}`);
  }

  switch (action) {
    case 'implement':
      parts.push(`\nImplement the requested feature. Create or update files as needed.`);
      parts.push(`Follow the project's existing patterns and conventions.`);
      parts.push(`Use TypeScript. Include type definitions. Add JSDoc comments for public APIs.`);
      break;
    case 'review':
      parts.push(`\nReview the code above. Check for:`);
      parts.push(`- Bugs, security issues, and edge cases`);
      parts.push(`- Code quality and readability`);
      parts.push(`- Missing error handling`);
      parts.push(`- Testing gaps`);
      parts.push(`- Performance concerns`);
      break;
    case 'refactor':
      parts.push(`\nRefactor the code above to improve quality.`);
      parts.push(`Focus on: readability, smaller functions, clearer names, better error handling.`);
      parts.push(`Preserve the existing behavior — this is a refactor, not a rewrite.`);
      break;
  }

  return parts.join('\n');
}
