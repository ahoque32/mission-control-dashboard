# Firebase Listeners Audit Report

**Date:** 2026-02-07  
**Audited by:** ralph-agent  
**Branch:** audit/dashboard-activity

## Objective
Audit `~/mission-control/dashboard/lib/firebase.ts` to ensure onSnapshot listeners are working correctly.

---

## Audit Checklist Results

### ✅ 1. Are all collections being listened to?

**Status:** PASS

All required collections have real-time listener hooks:
- **agents** → `useAgents()` (orderBy name, limit 100)
- **tasks** → `useTasks()` (orderBy updatedAt desc, limit 200)
- **activities** → `useActivity()` (orderBy createdAt desc, limit 100)
- **messages** → `useMessages()` (orderBy createdAt asc, limit 500)

Additional hooks found:
- `useDocuments()` - documents collection
- `useTaskMessages(taskId)` - messages filtered by taskId
- `useTask(taskId)` - single task document listener

---

### ✅ 2. Do the listeners handle reconnection properly?

**Status:** PASS

**Findings:**
- `onSnapshot()` automatically handles reconnection (Firebase SDK feature)
- Network errors are properly categorized via `categorizeFirestoreError()`
- Error types include: `permission`, `network`, `not-found`, `other`
- Network error codes handled:
  - `unavailable`
  - `deadline-exceeded`
  - `cancelled`

**User-facing behavior:**
- Network errors display: "Network error while loading {context}. Will retry when connection is restored."
- Listeners automatically resume when connection restored
- No manual reconnection logic needed

---

### ✅ 3. Is there proper error handling for permission-denied?

**Status:** PASS

**Findings:**
- `categorizeFirestoreError()` explicitly handles:
  - `permission-denied`
  - `unauthenticated`
- Returns categorized `errorType` in hook results
- User-friendly error messages via `getErrorMessage()`
- Each hook exposes:
  - `error: Error | null`
  - `errorType: 'permission' | 'network' | 'not-found' | 'other' | null`

**Error messages:**
- Permission: "Access denied to {context}. Please check your permissions."
- Network: "Network error while loading {context}. Will retry when connection is restored."
- Not found: "{context} not found."

---

### ✅ 4. Are timestamps being parsed correctly from Firestore?

**Status:** PASS

**Findings:**
- Type definitions in `types/index.ts` correctly use `Timestamp` from `firebase/firestore`
- All timestamp fields properly typed:
  - `lastHeartbeat: Timestamp`
  - `createdAt: Timestamp`
  - `updatedAt: Timestamp`
  - `dueDate: Timestamp | null`
- Code correctly uses `.toMillis()` method to extract milliseconds
- Firestore v9+ automatically returns `Timestamp` objects (no manual conversion needed)

**Example usage:**
```typescript
const now = Date.now();
const then = timestamp.toMillis();
const diffMs = now - then;
```

---

### ✅ 5. Is there a loading state that resolves once data arrives?

**Status:** PASS

**Findings:**
- All hooks initialize with `loading: true`
- Loading state set to `false` when:
  - Snapshot successfully arrives
  - Error occurs
- Return type includes:
  - `loading: boolean`
  - `error: Error | null`
  - `errorType: ...`

**Behavior:**
- Initial render shows loading state
- Data arrives → loading becomes false
- Error occurs → loading becomes false + error populated

---

## Additional Verification: lastHeartbeat Display

**Requirement:** The 'agents' page should show lastHeartbeat as human-readable relative time (e.g., '2 minutes ago'), not raw timestamp.

**Status:** ✅ PASS

**Findings:**
- `formatRelativeTime()` function in both:
  - `app/agents/page.tsx`
  - `components/AgentCard.tsx`
- Correctly converts `Timestamp` to human-readable format:
  - "just now"
  - "1 min ago"
  - "5 mins ago"
  - "1 hour ago"
  - "3 hours ago"
  - "1 day ago"
  - "5 days ago"

**Display locations:**
1. **AgentCard.tsx:**
   - Shows relative time in "Last heartbeat:" field
   - Example: `formatRelativeTime(agent.lastHeartbeat)`

2. **agents/page.tsx (AgentDetailCard):**
   - Shows relative time prominently
   - Also shows absolute time: `new Date(agent.lastHeartbeat.toMillis()).toLocaleTimeString()`
   - Includes online/offline status indicator

---

## Code Quality Notes

### Strengths:
1. **Type safety**: All hooks have proper TypeScript types
2. **Error categorization**: User-friendly error messages
3. **Query limits**: All queries have sensible limits to prevent unbounded data
4. **Sanitization**: Tasks are sanitized to ensure required fields exist
5. **Consistent API**: All hooks return similar shape with `data`, `loading`, `error`, `errorType`

### Default Query Limits:
```typescript
const DEFAULT_LIMITS = {
  agents: 100,
  tasks: 200,
  activities: 100,
  messages: 500,
  documents: 100
} as const;
```

### Helper Functions:
- `categorizeFirestoreError()` - Categorizes errors for handling
- `getErrorMessage()` - Generates user-friendly error messages
- `sanitizeTask()` - Ensures tasks have all required fields
- `snapshotToArray()` - Converts QuerySnapshot to typed array

---

## Issues Found

**None.** All audit points pass.

---

## Recommendations

1. **Consider adding retry logic indicator**: While reconnection is automatic, consider showing a "reconnecting..." state in the UI when network errors occur.

2. **Document security rules**: The code includes comments about required Firestore Security Rules (e.g., "Read access to 'agents' collection for authenticated users"). Consider adding actual rule examples.

3. **Composite index documentation**: Some queries (e.g., `useTaskMessages`) require composite indexes. Document these in a `firestore.indexes.json` file.

4. **Optional: Add stale data indicator**: Consider showing when cached data is being displayed while reconnecting.

---

## Conclusion

**All 5 audit points PASS.** The Firebase listeners in `lib/firebase.ts` are correctly implemented with:
- Proper real-time subscriptions to all collections
- Automatic reconnection handling
- Comprehensive error handling and categorization
- Correct Firestore Timestamp parsing
- Loading states that resolve on data arrival
- Human-readable lastHeartbeat display

No fixes required. The implementation is production-ready.

---

## Files Audited
- `/home/ahawk/mission-control/dashboard/lib/firebase.ts` (main file)
- `/home/ahawk/mission-control/dashboard/lib/firebase-config.ts` (config)
- `/home/ahawk/mission-control/dashboard/types/index.ts` (type definitions)
- `/home/ahawk/mission-control/dashboard/app/agents/page.tsx` (agents display)
- `/home/ahawk/mission-control/dashboard/components/AgentCard.tsx` (agent card display)
