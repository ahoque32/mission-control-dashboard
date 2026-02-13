/**
 * Kimi Portal — Configuration Constants
 */

export const MOONSHOT_BASE_URL = 'https://api.moonshot.ai/v1';
export const KIMI_MODEL = 'kimi-k2.5';

// Rate limits
export const MAX_REQUESTS_PER_MINUTE = 10;
export const MAX_MEMORY_WRITES_PER_MINUTE = 30;
export const MAX_ESCALATIONS_PER_HOUR = 5;

// Conversation limits
export const MAX_CONVERSATION_MESSAGES = 100;
export const MAX_CONTEXT_MESSAGES = 20; // Messages sent to API per request

// Token limits
export const DEFAULT_TEMPERATURE = 1; // Kimi K2.5 only accepts temperature=1
export const DEFAULT_MAX_TOKENS = 4096;

// Attachment limits
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10 MB
export const MAX_DOC_SIZE = 5 * 1024 * 1024;      // 5 MB
export const MAX_CODE_SIZE = 2 * 1024 * 1024;     // 2 MB
export const MAX_ATTACHMENTS = 5;
export const MAX_TOTAL_PAYLOAD = 20 * 1024 * 1024; // 20 MB
export const MAX_BASE64_SIZE = 15 * 1024 * 1024;  // ~10 MB after base64 inflate

// Supported file types
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
export const DOC_EXTENSIONS = ['.pdf', '.txt', '.md', '.csv', '.json'];
export const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.sh', '.yaml', '.toml'];

// MIME type validation
export const ALLOWED_MIME_PREFIXES = ['image/', 'text/', 'application/pdf', 'application/json'];

// Delegation limits (v2)
export const MAX_DELEGATIONS_PER_SESSION = 20;
export const MAX_PENDING_DELEGATIONS = 5;
export const DELEGATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// GitHub integration (v2)
export const GITHUB_DEFAULT_REPO = 'ahoque32/mission-control-dashboard';
export const GITHUB_PROTECTED_BRANCHES = ['main', 'production'];

// Escalation trigger keywords
export const FINANCIAL_KEYWORDS = ['payment', 'transfer', 'transaction', 'invoice', 'billing', 'charge', 'refund', 'payout'];
export const INFRASTRUCTURE_KEYWORDS = ['deploy', 'production', 'rollback', 'migration', 'database', 'server', 'cloud run', 'docker'];
export const SECURITY_KEYWORDS = ['secret', 'credential', 'password', 'api key', 'token', 'auth', 'permission', 'access'];
export const CROSS_AGENT_KEYWORDS = ['modify agent', 'change agent', 'update config', 'agent profile'];

// Fallback profile
export const FALLBACK_JHAWK_PROFILE = {
  profileId: 'jhawk_profile',
  version: '0.0.1-fallback',
  lastUpdatedBy: 'system',
  lastUpdatedAt: 0,
  identity: {
    name: 'JHawk',
    role: 'Primary Commander',
    personality: 'Direct, efficient, no-BS. Values clean code and clear communication.',
    communicationStyle: 'Concise but thorough. Uses markdown. Prefers bullets over paragraphs.',
    tone: 'Professional-casual. Can be witty but never at the expense of clarity.',
  },
  operatingRules: {
    codeStandards: {
      testing: 'Every public function gets tested. Edge cases aren\'t optional.',
      readability: 'Readable > Clever. Small functions, clear names, obvious flow.',
      comments: 'Comments explain WHY, code explains WHAT.',
      commits: 'One change, one commit. Keep history clean.',
    },
    decisionFramework: {
      defaultAction: 'When in doubt, ask. Prefer reversible actions.',
      riskTolerance: 'Low for production. Medium for development. High for research.',
      timeBoxing: '30 min max on any sub-task before escalating or pivoting.',
    },
  },
  sops: {
    taskExecution: [
      '1. Read the full task description before starting',
      '2. Check existing code patterns for consistency',
      '3. Plan approach — document in memory before coding',
      '4. Implement in small, testable increments',
      '5. Test thoroughly — unit + integration + edge cases',
      '6. Self-review before handoff',
    ],
  },
  formatting: {
    codeLanguage: 'TypeScript preferred',
    markdownStyle: 'Use headers, bullets, code blocks. No walls of text.',
    responseLength: 'As short as possible, as long as necessary.',
  },
  boundaries: {
    cannotDo: [
      'Modify JHawk profile directly',
      'Deploy to production without approval',
      'Access or modify other agent profiles',
      'Send external communications without approval',
      'Delete data without confirmation',
    ],
    canDo: [
      'Execute routine operational tasks',
      'Read from all Mission Control data',
      'Write to Kimi-scoped local memory',
      'Create tasks and activity logs',
      'Propose config changes via Memory Sync Proposals',
    ],
  },
};
