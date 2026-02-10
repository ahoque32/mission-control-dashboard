# Overnight Progress: Security Cleanup + Firebase Auth

**Started:** 2026-02-10 22:15 UTC
**Branch:** `feature/security-auth`
**Agent:** Ralph

---

## Secrets Inventory

| Secret | File(s) | Status |
|--------|---------|--------|
| PayPal Client ID | `app/api/paypal/payout/route.ts` | 🔴 Hardcoded |
| PayPal Client Secret | `app/api/paypal/payout/route.ts` | 🔴 Hardcoded |
| Plaid Client ID | `app/api/plaid/transactions/route.ts`, `app/api/finance/chat/route.ts` | 🔴 Hardcoded |
| Plaid Secret | `app/api/plaid/transactions/route.ts`, `app/api/finance/chat/route.ts` | 🔴 Hardcoded |
| Plaid Access Token | `app/api/plaid/transactions/route.ts`, `app/api/finance/chat/route.ts` | 🔴 Hardcoded |
| Gemini API Key | `.env.local`, `Dockerfile` ENV | 🔴 Hardcoded in Dockerfile |
| Convex URL | `.env.local`, `Dockerfile` ENV | 🟡 Public key (NEXT_PUBLIC_) - OK in Dockerfile |

---

## Progress Log

### Phase 1: Secrets Cleanup
- [ ] Create GCP secrets
- [ ] Update PayPal route to use env vars
- [ ] Update Plaid transactions route to use env vars
- [ ] Update Finance chat route to use env vars
- [ ] Update Dockerfile to remove hardcoded secrets
- [ ] Update deploy.yml to inject secrets
- [ ] Commit: secrets cleanup

### Phase 2: Firebase Auth
- [ ] Install firebase + firebase-admin
- [ ] Create lib/firebase.ts
- [ ] Create lib/auth-context.tsx
- [ ] Create components/LoginButton.tsx
- [ ] Create middleware.ts (or client-side gate)
- [ ] Update layout.tsx with AuthProvider
- [ ] Update Header.tsx with user info + logout
- [ ] Commit: firebase auth

### Phase 3: Validation
- [ ] npm run build passes
- [ ] grep check: no hardcoded secrets
- [ ] Push + PR created

---
