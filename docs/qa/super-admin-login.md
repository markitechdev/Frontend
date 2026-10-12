# QA Review: Super Admin Login & Authentication Interface

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/views/auth/LoginView.vue`, `src/stores/auth.js`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Production Login Screen Exposes Hardcoded Demo Credentials

**Issue:**  
Exposed Pre-filled Demo Accounts with Plaintext Passwords on Sign-in Page

**Repository:**  
Frontend

**Area:**  
`src/views/auth/LoginView.vue` (Lines 14-19, 97-107)

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Navigate to `/login` in any browser on desktop or mobile.
2. Scroll to the "Demo accounts" section below the sign-in form.
3. Observe buttons for "Super Admin", "Warehouse Admin", "Staff Admin", and "Finance Admin".
4. Click "Super Admin" and view the form fields being automatically populated with `superadmin@ims.local` and plaintext password `[redacted]`.

**Expected Result:**  
Production login interfaces must not expose pre-configured administrator credentials or test accounts in client-side code bundles. Demo helpers should be strictly guarded behind environment flags (`import.meta.env.DEV`) or removed in production builds.

**Actual Result:**  
Hardcoded demo credentials including Super Admin password (`[redacted]`) are permanently embedded in the client source bundle and displayed publicly on the UI.

**Developer Task:**  
Guard the demo accounts section behind `import.meta.env.DEV` condition and remove production fallback credentials.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Lack of Client-side Pre-validation and Field-Level Validation States

**Issue:**  
Missing Real-time Field Validation and Error Highlighting for Login Form

**Repository:**  
Frontend

**Area:**  
`src/views/auth/LoginView.vue` (Lines 66-82)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/login`.
2. Enter an invalid email format (e.g., `superadmin` without `@` or domain) and submit.
3. Observe default native HTML5 browser tooltip instead of consistent design system validation styling.
4. Enter a 1-character password and submit; request is sent to backend despite backend requiring a minimum of 6 characters.

**Expected Result:**  
The form should validate inputs before dispatching the network request:
- Inline validation messages below respective fields.
- Red border highlight on touched/invalid input fields.
- Client-side check ensuring password meets minimum length before API call.

**Actual Result:**  
Form relies solely on basic browser `required` and `type="email"` attributes. No inline error indicators, no dirty/touched state management, and short passwords bypass frontend validation to trigger avoidable backend 400 errors.

**Developer Task:**  
Implement structured form validation (e.g., using Zod/VeeValidate or reactive error state) with inline field-level validation messages and error border styling.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Ambiguous Error Handling on Failed Authentication

**Issue:**  
Generic Server Error Display Without Field Association or Rate Limit Feedback

**Repository:**  
Frontend

**Area:**  
`src/views/auth/LoginView.vue` (Lines 84-86)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/login`.
2. Enter valid email format but incorrect password.
3. Click "Sign in".
4. Enter incorrect password 5 consecutive times rapidly.

**Expected Result:**  
- Form should display a clear, accessible alert indicating invalid credentials without revealing whether email or password was the incorrect component.
- Inputs should remain accessible, but password field should be automatically cleared and focused.
- Repeated rapid failures should display rate limit or lockout warnings if throttled.

**Actual Result:**  
A static banner renders `{{ auth.error }}` at the bottom of the form. Password field is not cleared, focus is not reset, and no retry or throttle indication is shown to the user.

**Developer Task:**  
Improve error UX: reset password input on failure, retain email, shift focus back to password field, and add explicit throttle/cooldown messaging when HTTP 429 is encountered.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 4: Accessibility and State Deficiencies in Password Visibility Toggle

**Issue:**  
Password Show/Hide Toggle Lacks Accessibility Attributes and Visual Consistency

**Repository:**  
Frontend

**Area:**  
`src/views/auth/LoginView.vue` (Lines 76-80)

**Priority:**  
P3

**Severity:**  
Low

**Steps to Reproduce:**
1. Navigate to `/login` using a screen reader or keyboard navigation.
2. Tab into the password input field.
3. Tab to the "Show" button.

**Expected Result:**  
Button should have `aria-label="Show password"` / `aria-label="Hide password"`, `aria-pressed`, and proper icon indicator rather than unstyled text.

**Actual Result:**  
Plain text button `<button type="button">Show</button>` with no ARIA attributes or keyboard state indicators.

**Developer Task:**  
Replace raw text toggle with an accessible icon button featuring appropriate `aria-label`, `aria-controls`, and `aria-pressed` attributes.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
