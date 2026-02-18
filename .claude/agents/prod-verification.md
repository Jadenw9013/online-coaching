# PROD VERIFICATION — Steadfast Release Gate

## Purpose

Prevent production-only failures by enforcing a strict pre-deploy checklist.

Working locally does NOT mean production ready.

No feature is complete until it passes this verification process.

---

# 1. STATIC VERIFICATION (REQUIRED)

Run:

npm run build  
npm run lint  

If Prisma schema changed:

npx prisma validate  
npx prisma generate  
npx prisma migrate dev  

Confirm:
- No TypeScript errors
- No ESLint errors
- No unused imports
- No server-only imports inside client components
- No client-only libraries imported in server code

---

# 2. ENVIRONMENT VERIFICATION (REQUIRED)

## 2.1 Vercel Environment Variables

Confirm these exist in Vercel (Production):

- DATABASE_URL
- CLERK_SECRET_KEY
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_CLOUD_VISION_API_KEY
- OPENAI_API_KEY

Confirm:
- Clerk keys are LIVE keys (not test/dev)
- Vision billing is enabled
- Vision budget is capped
- Vision daily quota is capped

---

## 2.2 No Hardcoded Base URLs

Search for:

localhost  
NEXT_PUBLIC_BASE_URL  
VERCEL_URL  

All client fetch calls must use relative paths:

fetch("/api/...")

Never construct absolute URLs in client code.

---

## 2.3 Case Sensitivity Check (Critical)

Because Windows is case-insensitive and Vercel is not:

Verify:
- All public asset paths match exact file names
- All route folder names match fetch paths exactly
- No mismatch like:
  mealplans vs meal-plans
  Steadfast.png vs steadfast.png

---

# 3. PRODUCTION MODE TEST (REQUIRED)

Test locally in production mode:

npm run build  
npm start  

Do NOT rely only on `npm run dev`.

---

# 4. CORE WORKFLOW TESTS (REQUIRED)

## Coach

1. Upload Image
   - OCR succeeds
   - LLM parses
   - Draft created
   - Redirect works

2. Upload PDF
   - No DOMMatrix error
   - No browser-only PDF libs used server-side
   - Draft created

3. Import Without Check-In
   - Draft created
   - Review page loads
   - Empty state shown
   - No 404

4. Import With Check-In
   - Check-in summary visible
   - No crash

---

## Client

1. Submit Check-In
   - Metrics saved
   - Photos uploaded via signed URL
   - No 500 error

2. View Current Plan
   - Published plan loads
   - No undefined errors

---

# 5. EDGE CASE TESTS (REQUIRED)

## OCR Failure
Simulate:
- Invalid file
- Billing disabled

Expected:
- Friendly error
- No raw JSON shown
- No crash

## LLM Malformed Output
Simulate:
- Empty portion
- Missing field

Expected:
- Import still succeeds
- Null portions handled gracefully
- No schema crash

---

# 6. ROLE BOUNDARY TESTS (REQUIRED)

- Client cannot access /coach/*
- Coach cannot access /client/*
- Coach cannot access unrelated client
- No 500s — only 401 or 403

---

# 7. ROUTE VERIFICATION (REQUIRED)

Manually hit these in production:

/api/mealplans/import  
/api/uploads/...  
/coach/clients/[clientId]/review/[weekStartDate]  

Expected:
- 405 or 401 (NOT 404)

If 404:
- Route mismatch
- Wrong folder name
- Not deployed

---

# 8. EXTERNAL SERVICE SAFETY

Google Vision:
- Billing enabled
- Budget capped
- Daily quota capped
- API restricted to Vision only

OpenAI:
- Correct model configured
- No dev-only model in prod
- Errors logged server-side only

---

# 9. LOGGING DISCIPLINE

Ensure:
- All API errors return structured JSON:
  { error: { code, message } }

- No provider raw JSON sent to client
- No secrets logged client-side

---

# DEPLOY RULE

If a production-only bug appears that this document would have caught:

Update this file immediately.

---

# STANDARD

Steadfast must feel:

Focused  
Calm  
Reliable  
Premium  
Never chaotic  

Production reliability is part of the product.
