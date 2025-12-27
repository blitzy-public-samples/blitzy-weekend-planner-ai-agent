# Technical Specification

# 0. Agent Action Plan

## 0.1 Intent Clarification

### 0.1.1 Core Objective

Based on the provided requirements, the Blitzy platform understands that the objective is to **fix all identified frontend bugs, create comprehensive documentation, and add test coverage** for the Weekend Planner application. The frontend is currently non-functional and must be restored to a working state while the backend remains frozen.

**Primary Requirements:**

- Fix the session management API endpoint architecture from `POST /run` to a two-step session-based flow using Google ADK conventions
- Fix Kids Ages field validation to accept comma-separated integers with spaces and enforce proper age range (0 < age < 120)
- Remove unused form fields (Start Date, End Date, Preferences) and rename "Location" to "Zip Code"
- Relax mandatory field requirements so only Zip Code is required
- Fix color contrast for WCAG AA compliance by replacing salmon (#E07A5F) with dark blue (#1e3a5f)
- Create comprehensive README documentation enabling zero-assistance setup
- Add test coverage validating all bug fixes using MSW mock handlers

**Implicit Requirements Detected:**

- Update `GeneratePlanInput` TypeScript interface to reflect removed fields
- Update all existing tests to match new form structure and API behavior
- Update MSW handlers to support the two-step session flow
- Update Tailwind configuration and CSS custom properties for new color scheme
- Ensure all component files using color classes are updated

### 0.1.2 Task Categorization

| Dimension | Classification |
|-----------|----------------|
| Primary Task Type | Bug Fix |
| Secondary Aspects | Documentation, Configuration, Testing |
| Scope Classification | Cross-cutting change |

### 0.1.3 Special Instructions and Constraints

**User-Specified Directives:**

- **DO NOT** modify any files in `backend/` directory
- **DO NOT** modify ADK agent code
- **DO NOT** change backend API contracts
- Frontend is broken—fix it completely. Refactoring is permitted where necessary
- If additional frontend issues are discovered, fix them and document what was changed

**Methodological Requirements:**

- Form must contain exactly two fields: Zip Code (required) and Kids Ages (optional)
- Zip Code validation: Non-empty string
- Kids Ages validation: Comma-separated integers where 0 < age < 120
- Session ID generated client-side via `crypto.randomUUID()`
- Use static `userId` (e.g., `"user-1"`) or generate per-session
- Color scheme: Dark blue (#1e3a5f) primary with white (#ffffff) background

**User Example (preserved verbatim):**

User Example - Age Parsing:
```typescript
function parseKidsAges(input: string): number[] | null {
  if (!input.trim()) return []; // Empty is valid (optional field)
  
  const ages = input.split(',').map(s => s.trim());
  const result: number[] = [];
  
  for (const age of ages) {
    const num = parseInt(age, 10);
    if (isNaN(num) || age !== String(num) || num <= 0 || num >= 120) {
      return null; // Invalid
    }
    result.push(num);
  }
  return result;
}
```

User Example - Session Flow:
```typescript
// Step 1: Generate session ID client-side
const sessionId = crypto.randomUUID();

// Step 2: Create session
POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
Body: {} (empty)
Response: 200 OK (session created)

// Step 3: Send message to session
POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
Body: { "new_message": { "role": "user", "parts": [{ "text": "..." }] } }
Response: { plan data }
```

### 0.1.4 Technical Interpretation

These requirements translate to the following technical implementation strategy:

- To **fix session management**, we will refactor `frontend/src/api/client.ts` to implement a two-step session flow: first creating a session with an empty body POST, then sending the plan request with `new_message` payload to the same endpoint
- To **fix Kids Ages validation**, we will rewrite the parsing logic in `frontend/src/components/InputForm.tsx` to accept whitespace around commas and validate ages against the range 0 < age < 120
- To **remove unused fields**, we will delete Start Date, End Date, and Preferences inputs from `InputForm.tsx`, rename Location to Zip Code, and update the `GeneratePlanInput` interface in `frontend/src/types.ts`
- To **relax field requirements**, we will modify form validation to only require Zip Code, making Kids Ages optional
- To **fix color contrast**, we will update `frontend/tailwind.config.cjs` and `frontend/src/index.css` to replace #E07A5F with #1e3a5f throughout the theme
- To **create documentation**, we will comprehensively rewrite `README.md` with prerequisites, environment setup, installation, running instructions, API endpoints, testing, and troubleshooting sections
- To **add test coverage**, we will create/update tests in `frontend/src/__tests__/` with MSW handlers supporting the session-based API flow

## 0.2 Repository Scope Discovery

### 0.2.1 Comprehensive File Analysis

**Repository Structure Overview:**

```
/tmp/blitzy/blitzy-weekend-planner-ai-agent/main/
├── README.md                     # Root documentation (UPDATE)
├── frontend/                     # React SPA (primary scope)
│   ├── package.json              # Dependencies manifest
│   ├── tailwind.config.cjs       # Tailwind theme (UPDATE)
│   ├── vite.config.ts            # Build configuration
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # API client (UPDATE)
│   │   ├── components/
│   │   │   ├── InputForm.tsx     # Form component (UPDATE)
│   │   │   ├── PlanView.tsx      # Plan display
│   │   │   ├── LoadingState.tsx  # Loading indicator
│   │   │   ├── ErrorDisplay.tsx  # Error display
│   │   │   └── RawOutput.tsx     # Raw output display
│   │   ├── __mocks__/
│   │   │   └── handlers.ts       # MSW handlers (UPDATE)
│   │   ├── __tests__/
│   │   │   ├── api/
│   │   │   │   └── client.test.ts    # API tests (UPDATE)
│   │   │   └── components/
│   │   │       ├── InputForm.test.tsx # Form tests (UPDATE)
│   │   │       └── [other tests]
│   │   ├── App.tsx               # Main application (REVIEW for colors)
│   │   ├── index.css             # Global styles (UPDATE)
│   │   ├── types.ts              # TypeScript interfaces (UPDATE)
│   │   └── main.tsx              # Entry point
│   ├── e2e/
│   │   └── smoke.spec.tsx        # E2E tests (UPDATE)
│   └── docs/                     # Frontend documentation
├── WeekendPlanner/               # Backend (DO NOT MODIFY)
└── blitzy/                       # Documentation artifacts
```

**Files Identified for Modification:**

| Category | Files | Change Type |
|----------|-------|-------------|
| API Layer | `frontend/src/api/client.ts` | Major refactor |
| Components | `frontend/src/components/InputForm.tsx` | Major refactor |
| Types | `frontend/src/types.ts` | Interface updates |
| Styling | `frontend/tailwind.config.cjs` | Color scheme update |
| Styling | `frontend/src/index.css` | CSS variable updates |
| Styling | `frontend/src/App.tsx` | Color class review |
| Testing | `frontend/src/__mocks__/handlers.ts` | Session flow handlers |
| Testing | `frontend/src/__tests__/api/client.test.ts` | New test cases |
| Testing | `frontend/src/__tests__/components/InputForm.test.tsx` | Updated test cases |
| Testing | `frontend/e2e/smoke.spec.tsx` | E2E test updates |
| Documentation | `README.md` | Comprehensive rewrite |

### 0.2.2 Web Search Research Conducted

**Google ADK Session API Best Practices:**

Research confirmed the correct ADK API pattern:
- Session creation: `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}` with optional state in body
- Message sending: Same endpoint with `new_message` payload containing `role` and `parts`
- Session IDs should be client-generated UUIDs
- Sessions can be created with empty body `{}` for minimal initialization

**WCAG AA Color Contrast Requirements:**

- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Dark blue (#1e3a5f) on white (#ffffff) provides ~10.5:1 ratio (excellent)
- Salmon (#E07A5F) on white fails at ~3.0:1 ratio (insufficient)

**React/Vitest Testing Best Practices:**

- Use `@testing-library/react` with `userEvent` for interaction simulation
- Wrap state-changing operations in `act()` when testing async behavior
- MSW handlers should intercept at network level for realistic testing

### 0.2.3 Existing Infrastructure Assessment

**Project Structure:**
- Frontend: React 18.2.0 + Vite 5.x SPA with TypeScript
- Styling: Tailwind CSS 3.4.x with custom theme configuration
- Testing: Vitest 1.6.x + Testing Library + MSW 2.2.x
- Backend: Python ADK agent (frozen, not to be modified)

**Existing Patterns to Follow:**
- Component structure: Functional components with hooks
- Test organization: `__tests__/` folder mirroring `src/` structure
- CSS approach: Tailwind utility classes + custom CSS variables
- API client: Async functions with fetch, centralized error handling

**Build Configuration:**
- Vite with React plugin
- TypeScript strict mode
- PostCSS with Autoprefixer for Tailwind

**Current Test Infrastructure:**
- 103 tests passing across 7 test files
- Unit tests for components and API
- E2E smoke tests with component rendering verification
- MSW for API mocking

## 0.3 File Transformation Mapping

### 0.3.1 File-by-File Execution Plan

| Target File | Transformation | Source File/Reference | Purpose/Changes |
|-------------|----------------|----------------------|-----------------|
| `frontend/src/api/client.ts` | UPDATE | `frontend/src/api/client.ts` | Replace `POST /run` with two-step session flow: create session, then send message |
| `frontend/src/components/InputForm.tsx` | UPDATE | `frontend/src/components/InputForm.tsx` | Remove Start Date, End Date, Preferences; rename Location to Zip Code; fix age validation |
| `frontend/src/types.ts` | UPDATE | `frontend/src/types.ts` | Remove `startDate`, `endDate`, `preferences` from `GeneratePlanInput` interface |
| `frontend/tailwind.config.cjs` | UPDATE | `frontend/tailwind.config.cjs` | Change primary color from #E07A5F to #1e3a5f |
| `frontend/src/index.css` | UPDATE | `frontend/src/index.css` | Update CSS custom properties for dark blue theme |
| `frontend/src/App.tsx` | UPDATE | `frontend/src/App.tsx` | Review and update any hardcoded color classes |
| `frontend/src/__mocks__/handlers.ts` | UPDATE | `frontend/src/__mocks__/handlers.ts` | Add session creation and message handlers for two-step flow |
| `frontend/src/__tests__/api/client.test.ts` | UPDATE | `frontend/src/__tests__/api/client.test.ts` | Add tests for session creation, unique session IDs, error handling |
| `frontend/src/__tests__/components/InputForm.test.tsx` | UPDATE | `frontend/src/__tests__/components/InputForm.test.tsx` | Add tests for field removal, age parsing with spaces, optional fields |
| `frontend/e2e/smoke.spec.tsx` | UPDATE | `frontend/e2e/smoke.spec.tsx` | Update to reflect new form structure (two fields only) |
| `README.md` | UPDATE | `README.md` | Comprehensive rewrite with setup, running, API docs, troubleshooting |

### 0.3.2 Files to Modify Detail

**`frontend/src/api/client.ts`** - Session-Based API Implementation:
- Remove: `POST /run` endpoint call
- Add: Session creation function with empty body to `/apps/WeekendPlanner/users/{userId}/sessions/{sessionId}`
- Add: Message sending to same endpoint with `new_message` payload
- Add: UUID generation using `crypto.randomUUID()`
- Add: Error handling for session creation failure
- Preserve: Base URL configuration from environment

**`frontend/src/components/InputForm.tsx`** - Form Field Refactoring:
- Delete: Start Date input, label, state, and validation
- Delete: End Date input, label, state, and validation
- Delete: Preferences input, label, state, and validation
- Rename: "Location" label to "Zip Code"
- Update: Age parsing function per user specification
- Update: Form validation to require only Zip Code
- Update: Submit handler to omit removed fields

**`frontend/src/types.ts`** - Interface Updates:
- Remove: `startDate: string` property
- Remove: `endDate: string` property
- Remove: `preferences: string` property
- Keep: `location` property (renamed semantically to zip code)
- Keep: `kidsAges: number[]` property

**`frontend/tailwind.config.cjs`** - Color Theme:
- Change: `primary` color from `#E07A5F` (salmon) to `#1e3a5f` (dark blue)
- Ensure: All color utilities derive from updated primary

**`frontend/src/index.css`** - CSS Variables:
- Update: `--color-primary` to `#1e3a5f`
- Update: `--color-text` to appropriate contrast values
- Update: Any other salmon/coral references

**`frontend/src/__mocks__/handlers.ts`** - MSW Handlers:
- Add: Handler for `POST /apps/WeekendPlanner/users/:userId/sessions/:sessionId`
- Add: Logic to differentiate empty body (session creation) vs `new_message` body (plan generation)
- Return: Appropriate mock responses for both scenarios

**`frontend/src/__tests__/api/client.test.ts`** - API Tests:
- Add: Test for session creation before plan request
- Add: Test for correct endpoint usage
- Add: Test for unique session ID generation
- Add: Tests for error handling on session creation failure
- Add: Test for correct `new_message` payload format

**`frontend/src/__tests__/components/InputForm.test.tsx`** - Form Tests:
- Add: Tests verifying Start Date, End Date, Preferences fields are NOT rendered
- Add: Tests for age parsing with various whitespace patterns
- Add: Tests for age validation edge cases (0, 120, negative, decimals)
- Add: Tests for form submission with only Zip Code
- Update: Existing tests to match new form structure

**`frontend/e2e/smoke.spec.tsx`** - E2E Tests:
- Update: Form interaction tests to use only Zip Code and Kids Ages
- Remove: Tests referencing removed fields
- Add: Validation for new form structure

**`README.md`** - Documentation:
- Add: Prerequisites section (Node.js >= 18.x, Python >= 3.9, ADK CLI)
- Add: Environment setup with `.env` configuration
- Add: Installation instructions for frontend and backend
- Add: Running instructions with terminal commands
- Add: API endpoints documentation
- Add: Testing instructions
- Add: Troubleshooting table

### 0.3.3 Configuration and Documentation Updates

**Configuration Changes:**

| Config File | Settings to Update | Impact |
|-------------|-------------------|--------|
| `frontend/tailwind.config.cjs` | `theme.extend.colors.primary` | All UI using `bg-primary`, `text-primary`, etc. |
| `frontend/src/index.css` | CSS custom properties | Root-level color variables |
| `frontend/.env.example` | (verify) API URL | Environment configuration documentation |

**Documentation Updates:**

| Doc File | Sections to Add/Update |
|----------|----------------------|
| `README.md` | Prerequisites, Environment, Installation, Running, API, Testing, Troubleshooting |
| `frontend/docs/USER_GUIDE.md` | Update form field descriptions if exists |

### 0.3.4 Cross-File Dependencies

**Import/Reference Updates:**
- `InputForm.tsx` → `types.ts`: Must match updated `GeneratePlanInput` interface
- `App.tsx` → `api/client.ts`: `generatePlan` function signature unchanged (internal implementation changes)
- `client.test.ts` → `handlers.ts`: MSW handlers must match test expectations

**Configuration Sync Requirements:**
- Tailwind config colors must align with CSS variable definitions
- MSW handler endpoints must match `client.ts` API calls
- Test assertions must reflect actual component behavior

**Documentation Consistency:**
- README API documentation must match `client.ts` implementation
- Troubleshooting errors must correspond to actual error messages

## 0.4 Dependency Inventory

### 0.4.1 Key Private and Public Packages

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | react | 18.2.0 | UI component framework |
| npm | react-dom | 18.2.0 | React DOM rendering |
| npm | vite | ^5.0.0 | Build tool and dev server |
| npm | vitest | ^1.6.0 | Test runner |
| npm | @testing-library/react | ^14.2.0 | React testing utilities |
| npm | @testing-library/user-event | ^14.5.0 | User interaction simulation |
| npm | @testing-library/jest-dom | ^6.4.0 | DOM matchers for testing |
| npm | msw | ^2.2.0 | API mocking for tests |
| npm | tailwindcss | ^3.4.0 | Utility-first CSS framework |
| npm | typescript | ^5.0.0 | TypeScript compiler |
| npm | jsdom | ^24.0.0 | DOM simulation for tests |
| pip | google-adk | latest | Google Agent Development Kit (backend) |

### 0.4.2 Dependency Updates

**New Dependencies to Add:**
- None required. All necessary packages are already present in `package.json`.

**Dependencies to Update:**
- None required. Current versions are compatible with implementation needs.

**Dependencies to Remove:**
- None required.

### 0.4.3 Import/Reference Updates

**Files Requiring Import Updates:**

| File | Current Import | Updated Import | Reason |
|------|----------------|----------------|--------|
| `frontend/src/api/client.ts` | N/A | N/A | No new imports needed; uses native `crypto.randomUUID()` |
| `frontend/src/components/InputForm.tsx` | Full interface | Reduced interface | Removed fields from `GeneratePlanInput` |

**Import Transformation Rules:**

For `types.ts` interface changes:
```typescript
// Old GeneratePlanInput interface
interface GeneratePlanInput {
  location: string;
  startDate: string;
  endDate: string;
  preferences: string;
  kidsAges: number[];
}

// New GeneratePlanInput interface
interface GeneratePlanInput {
  location: string;  // Semantically: Zip Code
  kidsAges: number[];
}
```

**Apply to:**
- `frontend/src/types.ts` - Define interface
- `frontend/src/components/InputForm.tsx` - Use interface
- `frontend/src/api/client.ts` - Use interface in API call

## 0.5 Implementation Design

### 0.5.1 Technical Approach

**Primary Objectives with Implementation Approach:**

1. **Fix Session Management API** by refactoring `client.ts` to implement two-step ADK session flow
   - Generate client-side UUID for session identification
   - Create session with empty body POST before sending plan request
   - Send plan request with `new_message` payload to same session endpoint
   - Implement proper error handling for both steps

2. **Fix Kids Ages Validation** by rewriting parsing logic in `InputForm.tsx`
   - Split input by comma and trim whitespace from each segment
   - Parse as integers and validate 0 < age < 120
   - Return empty array for empty input (optional field)
   - Return null for invalid input to trigger form validation error

3. **Remove Unused Form Fields** by deleting UI elements and state from `InputForm.tsx`
   - Remove Start Date, End Date, Preferences inputs and labels
   - Update state management to exclude removed fields
   - Update TypeScript interface to match

4. **Achieve WCAG AA Compliance** by updating color scheme throughout
   - Update Tailwind theme primary color
   - Update CSS custom properties
   - Review all components for hardcoded color references

**Logical Implementation Flow:**

- **First**, establish the API foundation by implementing the session-based flow in `client.ts` and updating MSW handlers
- **Next**, refactor the form component to remove unused fields and fix validation
- **Then**, update the type definitions to match the new form structure
- **Following that**, update all tests to validate the new behavior
- **Subsequently**, update the color scheme across configuration and styles
- **Finally**, create comprehensive documentation in README.md

### 0.5.2 Component Impact Analysis

**Direct Modifications Required:**

| Component | Modification | Capability Enabled |
|-----------|-------------|-------------------|
| `client.ts` | Refactor `generatePlan()` | Correct ADK session API usage |
| `InputForm.tsx` | Remove fields, fix validation | Clean two-field form with proper validation |
| `types.ts` | Update interface | Type safety for new form structure |
| `tailwind.config.cjs` | Update colors | WCAG compliant color scheme |
| `index.css` | Update CSS variables | Consistent styling |
| `handlers.ts` | Add session handlers | Test support for new API |

**Indirect Impacts and Dependencies:**

| Component | Update Required | Reason |
|-----------|-----------------|--------|
| `App.tsx` | Review color classes | May have hardcoded salmon references |
| `client.test.ts` | Update assertions | Tests must match new API behavior |
| `InputForm.test.tsx` | Update test cases | Tests must match new form structure |
| `smoke.spec.tsx` | Update E2E tests | E2E must use new form fields |

**New Components Introduction:**

No new components required. All changes are modifications to existing files.

### 0.5.3 User-Provided Examples Integration

**Age Parsing Implementation:**

The user's example of age parsing will be implemented in `InputForm.tsx` as the `parseKidsAges` function:

```typescript
function parseKidsAges(input: string): number[] | null {
  if (!input.trim()) return [];
  const ages = input.split(',').map(s => s.trim());
  const result: number[] = [];
  for (const age of ages) {
    const num = parseInt(age, 10);
    if (isNaN(num) || age !== String(num) || num <= 0 || num >= 120) {
      return null;
    }
    result.push(num);
  }
  return result;
}
```

**Session Flow Implementation:**

The user's example of session flow will be implemented in `client.ts` as the `generatePlan` function:

```typescript
export async function generatePlan(input: GeneratePlanInput) {
  const sessionId = crypto.randomUUID();
  const userId = 'user-1';
  const endpoint = `${API_BASE}/apps/WeekendPlanner/users/${userId}/sessions/${sessionId}`;
  
  // Step 1: Create session
  await fetch(endpoint, { method: 'POST', body: '{}' });
  
  // Step 2: Send message
  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      new_message: { role: 'user', parts: [{ text: '...' }] }
    })
  });
}
```

### 0.5.4 Critical Implementation Details

**Design Patterns Employed:**

- **Two-Phase API Pattern**: Session creation followed by message sending
- **Client-Side ID Generation**: UUID creation on frontend for session tracking
- **Graceful Degradation**: Empty optional field handling
- **Fail-Fast Validation**: Return null on first invalid input

**Key Algorithms:**

- **Age Parsing**: Split → Trim → Parse → Validate → Collect
- **Session Management**: Generate ID → Create Session → Send Message → Handle Response

**Integration Strategies:**

- MSW intercepts at network layer for seamless test/production parity
- Tailwind theme propagates colors through utility class system
- TypeScript interfaces enforce contract between components

**Data Flow Modifications:**

```
User Input → InputForm (validation) → generatePlan() → 
  → Session Creation (ADK) → Message Send (ADK) → 
  → Response Handling → UI Update
```

**Error Handling:**

- Session creation failure: Abort and display user error
- Plan generation failure: Display error with retry option
- Validation failure: Inline form error messages

**Edge Case Considerations:**

- Empty Kids Ages: Valid (returns empty array)
- Whitespace-only input: Invalid
- Age boundary values: 0 (invalid), 1 (valid), 119 (valid), 120 (invalid)
- Network timeout: Show error state
- Invalid session: Generate new session ID and retry

## 0.6 Scope Boundaries

### 0.6.1 Exhaustively In Scope

**Source Code Changes:**

- `frontend/src/api/client.ts` - Session-based API implementation
- `frontend/src/components/InputForm.tsx` - Form field refactoring and validation fixes
- `frontend/src/types.ts` - TypeScript interface updates
- `frontend/src/App.tsx` - Color class review and updates

**Configuration Updates:**

- `frontend/tailwind.config.cjs` - Primary color theme update
- `frontend/src/index.css` - CSS custom property updates
- `frontend/.env.example` - Verification of API URL configuration

**Documentation Updates:**

- `README.md` - Comprehensive rewrite with all required sections
- `frontend/docs/*.md` - Updates if field descriptions exist

**Test Updates:**

- `frontend/src/__mocks__/handlers.ts` - Session flow MSW handlers
- `frontend/src/__tests__/api/client.test.ts` - API client tests
- `frontend/src/__tests__/components/InputForm.test.tsx` - Form component tests
- `frontend/e2e/smoke.spec.tsx` - E2E integration tests

**Build/Deployment:**

- No changes required to build configuration
- No changes required to deployment configuration

### 0.6.2 Explicitly Out of Scope

**Backend Modifications (User Mandate):**

- `backend/**/*` - All backend files frozen
- `WeekendPlanner/**/*` - ADK agent code frozen
- Backend API contracts - No changes to expected request/response formats

**Related Features Not Specified:**

- User authentication/authorization
- Session persistence across browser sessions
- Multi-user support beyond static user ID
- Accessibility features beyond color contrast
- Internationalization/localization
- Analytics or telemetry

**Performance Optimizations Beyond Requirements:**

- Code splitting/lazy loading
- API response caching
- Image optimization
- Service worker implementation

**Refactoring Unrelated to Core Objectives:**

- Component architecture restructuring
- State management library adoption
- Test framework migration
- Build tool changes

**Additional Tooling Not Mentioned:**

- ESLint/Prettier configuration changes
- Git hooks or pre-commit configuration
- CI/CD pipeline modifications
- Docker configuration

**Future Enhancements:**

- Additional form fields
- Plan customization options
- Save/share functionality
- Mobile responsiveness improvements

### 0.6.3 Boundary Clarifications

**API Endpoint Changes:**

| Item | In Scope | Out of Scope |
|------|----------|--------------|
| Frontend API calls | ✓ Change to session endpoints | ✗ Backend endpoint implementation |
| Request payload format | ✓ Match ADK `new_message` format | ✗ Change ADK expected format |
| Response handling | ✓ Parse ADK response | ✗ Change ADK response format |

**Form Field Changes:**

| Item | In Scope | Out of Scope |
|------|----------|--------------|
| Remove Start/End Date | ✓ Delete UI elements | ✗ Add new date-related fields |
| Remove Preferences | ✓ Delete UI elements | ✗ Add new preference options |
| Rename Location | ✓ Change label to "Zip Code" | ✗ Add address autocomplete |
| Fix Kids Ages | ✓ Validation logic | ✗ Age-based recommendations |

**Color Changes:**

| Item | In Scope | Out of Scope |
|------|----------|--------------|
| Primary color | ✓ Salmon → Dark blue | ✗ Full theme redesign |
| Contrast compliance | ✓ WCAG AA (4.5:1) | ✗ WCAG AAA (7:1) |
| CSS variables | ✓ Update existing | ✗ Add animation variables |

**Testing Changes:**

| Item | In Scope | Out of Scope |
|------|----------|--------------|
| Unit tests | ✓ Update for new behavior | ✗ Increase coverage target |
| E2E tests | ✓ Update for new form | ✗ Add new E2E scenarios |
| MSW handlers | ✓ Session flow support | ✗ Comprehensive API mocking |

## 0.7 Execution Parameters

### 0.7.1 Special Execution Instructions

**Process-Specific Requirements:**

- Frontend is non-functional; complete refactoring permitted to achieve working state
- All bug fixes must be accompanied by corresponding test coverage
- Documentation must enable zero-assistance setup
- Any additional frontend issues discovered should be fixed and documented

**Tools and Platforms:**

| Tool | Usage |
|------|-------|
| Node.js >= 18.x | Runtime environment |
| npm >= 9.x | Package management |
| Vitest | Test execution |
| MSW 2.x | API mocking |
| Tailwind CSS | Styling framework |
| Vite | Build tool |

**Quality Requirements:**

- All existing tests must pass after modifications
- New tests must be added for all bug fixes
- WCAG AA color contrast (4.5:1 minimum) required
- TypeScript strict mode compliance

**Code Review Requirements:**

- Changes should follow existing code patterns
- No breaking changes to component API signatures where possible
- Test coverage for all new and modified functionality

**Deployment Considerations:**

- Frontend changes only; no backend deployment needed
- Environment variable configuration must be documented
- Build process must complete without errors

### 0.7.2 Constraints and Boundaries

**Technical Constraints:**

- Must use `crypto.randomUUID()` for session ID generation
- Must use static user ID or generate per-session
- Must use two-step session flow (create then message)
- Must use exact ADK endpoint format: `/apps/WeekendPlanner/users/{userId}/sessions/{sessionId}`

**Process Constraints:**

- DO NOT modify backend code
- DO NOT modify ADK agent code
- DO NOT change backend API contracts
- DO preserve existing working functionality

**Output Constraints:**

- Form must render exactly two input fields
- Zip Code must be required
- Kids Ages must be optional
- Color scheme must use dark blue (#1e3a5f) and white (#ffffff)

**Compatibility Requirements:**

- React 18.2.0 compatibility
- Vite build compatibility
- Vitest test framework compatibility
- MSW 2.x handler format compatibility

### 0.7.3 Validation Checklist

Pre-completion verification requirements:

| Check | Validation Method |
|-------|-------------------|
| API endpoint correct | Test calls `/apps/WeekendPlanner/users/{userId}/sessions/{sessionId}` |
| Session ID generation | Verify `crypto.randomUUID()` usage |
| Two-step flow | Session created before plan request |
| Age parsing | `"5, 12, 8"` parses to `[5, 12, 8]` |
| Start Date removed | Field not rendered |
| End Date removed | Field not rendered |
| Preferences removed | Field not rendered |
| Form has two fields | Only Zip Code and Kids Ages present |
| Optional Kids Ages | Form submits with only Zip Code |
| Color scheme | Dark blue (#1e3a5f) applied |
| Documentation | README complete and accurate |
| Tests pass | `npm test` succeeds |
| MSW handlers | Support two-step session flow |

## 0.8 Special Instructions

### 0.8.1 Task-Specific Requirements

**Backend Freeze Mandate (User-Specified):**

> "Backend is frozen. Do not modify anything in `backend/` directory."

This constraint is absolute and non-negotiable. All changes must be limited to the `frontend/` directory and root documentation files.

**Frontend Refactoring Permission (User-Specified):**

> "Frontend is broken—fix it completely. Refactoring frontend code is permitted where necessary to achieve a working application."

This grants permission to make substantial changes to frontend code beyond simple bug fixes. Any changes must be documented.

**Additional Issue Discovery (User-Specified):**

> "If you discover additional frontend issues blocking functionality, fix them and document what was changed."

Any issues found during implementation should be fixed and recorded in the documentation.

### 0.8.2 Implementation Patterns to Follow

**Existing Pattern: API Client Structure**

Follow the existing pattern in `client.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export async function generatePlan(input: GeneratePlanInput): Promise<PlanResponse> {
  // Implementation
}
```

**Existing Pattern: Component Structure**

Follow the existing functional component pattern:
```typescript
export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [formData, setFormData] = useState<FormState>(initialState);
  // Hooks and handlers
  return (/* JSX */);
}
```

**Existing Pattern: Test Structure**

Follow the existing test organization:
```typescript
describe('ComponentName', () => {
  it('describes expected behavior', async () => {
    render(<Component />);
    expect(screen.getByRole(...)).toBeInTheDocument();
  });
});
```

### 0.8.3 Code Style and Conventions

**Match Existing Code Style:**

- Use functional components with TypeScript
- Use named exports for components
- Use async/await for asynchronous operations
- Use template literals for string interpolation
- Use destructuring for props and state

**Preserve Existing Conventions:**

- Test files colocated in `__tests__/` directory
- Mock handlers in `__mocks__/` directory
- Type definitions in `types.ts`
- CSS custom properties for theme values

### 0.8.4 Documentation Standards

**README Structure (Required Sections):**

1. Prerequisites
2. Environment Setup
3. Installation
4. Running the Application
5. API Endpoints
6. Testing
7. Troubleshooting

**Unverified Section Marking:**

Any documentation that cannot be validated must be marked:
```
⚠️ UNVERIFIED: [section name]
Reason: [why it couldn't be verified]
Manual verification: [steps user can take]
```

### 0.8.5 MSW Handler Format

**Required Handler Structure:**

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post(`${API_BASE}/apps/WeekendPlanner/users/:userId/sessions/:sessionId`, 
    async ({ request }) => {
      const body = await request.json().catch(() => null);
      
      // Empty body = session creation
      if (!body || Object.keys(body).length === 0) {
        return HttpResponse.json({ status: 'created' }, { status: 200 });
      }
      
      // Body with new_message = plan generation
      if (body.new_message) {
        return HttpResponse.json({
          candidates: [{
            content: { parts: [{ text: 'Mock weekend plan response' }] }
          }]
        }, { status: 200 });
      }
      
      return HttpResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  ),
];
```

### 0.8.6 Form Specification Compliance

**Exact Form Requirements:**

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| Zip Code | "Zip Code" | text | Yes | Non-empty string |
| Kids Ages | "Kids Ages" | text | No | Comma-separated integers, 0 < age < 120 |

**Remove All Other Fields:**

No Start Date, End Date, Preferences, or Location (renamed to Zip Code) fields beyond the two specified above.

