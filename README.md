# Weekend Planner AI Agent

An intelligent family weekend activity planner powered by Google Gemini 2.5 Flash and Google ADK (Agent Development Kit). This multi-agent system researches weather conditions and suggests personalized activities for families with children. This is a Kaggle Capstone project for Nov 2025 AI Agents Intensive.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Form Fields](#form-fields)
- [Testing](#testing)
- [Agent Architecture](#agent-architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Output](#output)
- [UI Design](#ui-design)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## Features

- **Weather-Aware Planning**: Checks weekend weather forecasts for your area
- **Smart Activity Routing**: Routes to outdoor or indoor activities based on weather
- **Personalized Recommendations**: Finds activities tailored to children's ages
- **Local Search Integration**: Uses Google Search to find real-time activities and events
- **Activity Categories**:
  - Local community activities
  - Special events (festivals, fairs, concerts)
  - Indoor at-home activities for bad weather
- **WCAG AA Compliant**: Accessible color scheme with 10.5:1 contrast ratio

## Prerequisites

Before setting up the Weekend Planner, ensure you have the following installed:

| Requirement | Minimum Version | Recommended | Purpose |
|-------------|-----------------|-------------|---------|
| Node.js | 18.x | 20.x LTS | Frontend runtime |
| npm | 9.x | 10.x | Package management |
| Python | 3.9 | 3.10+ | Backend runtime |
| Google ADK CLI | Latest | Latest | Agent development kit |

### Verifying Prerequisites

```bash
# Check Node.js version
node --version  # Should output v18.x.x or higher

# Check npm version
npm --version  # Should output 9.x.x or higher

# Check Python version
python3 --version  # Should output Python 3.9.x or higher

# Check if Google ADK is installed
adk --version  # Should output version info
```

### Installing Google ADK

If you don't have Google ADK installed:

```bash
pip install google-adk
```

## Environment Setup

### Backend Environment Configuration

1. Navigate to the project root directory:
```bash
cd WeekendPlanner
```

2. Create a `.env` file from the example template:
```bash
cp .env.example .env
# Or create manually:
echo 'GOOGLE_API_KEY="your-google-api-key-here"' > .env
```

3. Configure the required environment variables in `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Your Google API key for Gemini 2.5 Flash |
| `GCP_PROJECT_ID` | No | Google Cloud Project ID (optional) |

### Frontend Environment Configuration

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Create a `.env.local` file (or copy from `.env.example` if available):
```bash
# Create .env.local file
echo 'VITE_API_BASE_URL=http://localhost:8000' > .env.local
```

3. Frontend environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | Backend API URL |

## Installation

### Backend Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-folder>
```

2. Create and activate a Python virtual environment:
```bash
# Create virtual environment
python3 -m venv .venv

# Activate on macOS/Linux
source .venv/bin/activate

# Activate on Windows
.venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Verify installation:
```bash
npm run build  # Should complete without errors
```

## Running the Application

### Quick Start (Full Stack)

Run both the backend and frontend in **separate terminals**:

**Terminal 1 - Backend (ADK Agent Server):**
```bash
# Ensure virtual environment is activated
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate  # Windows

# Start the backend server
adk web
```
Backend API runs at: **http://localhost:8000**

**Terminal 2 - Frontend (React Development Server):**
```bash
cd frontend
npm run dev
```
Frontend runs at: **http://localhost:5173**

### Development Workflow

1. Start the backend first and wait for it to be fully running
2. Start the frontend in a separate terminal
3. Open http://localhost:5173 in your browser
4. The frontend will communicate with the backend API automatically

### Production Build

To build the frontend for production:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` directory.

## API Endpoints

The Weekend Planner uses a **two-step session-based API flow** following Google ADK conventions.

### Session Management Flow

#### Step 1: Create Session

Create a new session before sending plan requests.

```
POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
Content-Type: application/json

Body: {}
```

**Parameters:**
- `userId`: User identifier (e.g., `"user-1"`)
- `sessionId`: Client-generated UUID (use `crypto.randomUUID()`)

**Response:**
```json
{
  "status": "created"
}
```

#### Step 2: Send Plan Request

Send the plan generation request to the same session endpoint.

```
POST /apps/WeekendPlanner/users/{userId}/sessions/{sessionId}
Content-Type: application/json

Body:
{
  "new_message": {
    "role": "user",
    "parts": [
      {
        "text": "Plan weekend activities for zip code 90210 with kids ages 5, 8, 12"
      }
    ]
  }
}
```

**Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Weekend activity recommendations..."
          }
        ]
      }
    }
  ]
}
```

### Client Implementation Example

```typescript
// Generate unique session ID
const sessionId = crypto.randomUUID();
const userId = 'user-1';
const endpoint = `${API_BASE}/apps/WeekendPlanner/users/${userId}/sessions/${sessionId}`;

// Step 1: Create session
await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

// Step 2: Send plan request
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    new_message: {
      role: 'user',
      parts: [{ text: `Plan activities for ${zipCode} with kids ages ${ages.join(', ')}` }]
    }
  })
});
```

## Form Fields

The Weekend Planner form contains exactly **two input fields**:

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| Zip Code | "Zip Code" | text | **Yes** | Non-empty string |
| Kids Ages | "Kids Ages" | text | No | Comma-separated integers, 0 < age < 120 |

### Zip Code Field

- **Required**: Must be provided to generate a plan
- **Format**: Any non-empty string representing a location zip code
- **Example**: `"90210"`, `"10001"`, `"60601"`

### Kids Ages Field (Optional)

- **Format**: Comma-separated integers with optional whitespace
- **Validation**: Each age must be greater than 0 and less than 120
- **Examples**:
  - `"5, 8, 12"` → Valid: `[5, 8, 12]`
  - `"3,7,10"` → Valid: `[3, 7, 10]`
  - `" 5 , 12 "` → Valid: `[5, 12]`
  - `""` (empty) → Valid: `[]` (no children specified)
  - `"0, 5"` → Invalid: 0 is not a valid age
  - `"5, 150"` → Invalid: 150 exceeds maximum age

### Age Parsing Logic

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

## Testing

### Test Runner

The frontend uses **Vitest** as the test runner with **React Testing Library** for component tests and **MSW (Mock Service Worker)** for API mocking.

### Running Tests

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
frontend/
├── src/
│   ├── __mocks__/
│   │   └── handlers.ts       # MSW mock handlers for API
│   └── __tests__/
│       ├── api/
│       │   └── client.test.ts    # API client tests
│       └── components/
│           ├── InputForm.test.tsx # Form component tests
│           └── ...               # Other component tests
└── e2e/
    └── smoke.spec.tsx           # End-to-end smoke tests
```

### MSW Mock Handlers

The test suite uses MSW to mock API responses. Handlers support the two-step session flow:

```typescript
// Session creation (empty body)
POST /apps/WeekendPlanner/users/:userId/sessions/:sessionId
→ Returns: { status: 'created' }

// Plan generation (with new_message body)
POST /apps/WeekendPlanner/users/:userId/sessions/:sessionId
→ Returns: { candidates: [...] }
```

### Test Coverage Areas

- **API Client Tests**: Session creation, message sending, error handling
- **InputForm Tests**: Field validation, age parsing, form submission
- **Component Tests**: Rendering, user interactions, state management
- **E2E Smoke Tests**: Full application flow verification

## Agent Architecture

The system uses a multi-agent hierarchy:

0. **Input Parser**: Checks user input
1. **Weather Agent**: Checks weather conditions
2. **Weather Router**: Routes to appropriate activity planning based on weather
3. **Activity Research Group** (runs when weather is good):
   - Local Activities Agent: Finds nearby activities
   - Special Events Agent: Discovers festivals and events
4. **Home Activities Agent**: Suggests indoor activities when weather is poor
5. **Summarizer Agent**: Consolidates findings into recommendations

<img width="1166" height="281" alt="Agent Architecture Diagram" src="https://github.com/user-attachments/assets/ffb99c93-5deb-4170-bd32-609363e30fe6" />

## Project Structure

```
/
├── README.md                     # This documentation file
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment template
├── WeekendPlanner/               # Backend ADK agent
│   ├── __init__.py               # Package initialization
│   └── agent.py                  # Main agent definitions and orchestration
└── frontend/                     # React SPA
    ├── package.json              # Node.js dependencies
    ├── vite.config.ts            # Vite build configuration
    ├── tailwind.config.cjs       # Tailwind CSS theme
    ├── src/
    │   ├── main.tsx              # Application entry point
    │   ├── App.tsx               # Main application component
    │   ├── index.css             # Global styles
    │   ├── types.ts              # TypeScript interfaces
    │   ├── api/
    │   │   └── client.ts         # API client with session management
    │   ├── components/
    │   │   ├── InputForm.tsx     # Form component (Zip Code, Kids Ages)
    │   │   ├── PlanView.tsx      # Plan display component
    │   │   ├── LoadingState.tsx  # Loading indicator
    │   │   ├── ErrorDisplay.tsx  # Error display
    │   │   └── RawOutput.tsx     # Raw output display
    │   ├── __mocks__/
    │   │   └── handlers.ts       # MSW mock handlers
    │   └── __tests__/
    │       ├── api/
    │       │   └── client.test.ts
    │       └── components/
    │           └── InputForm.test.tsx
    └── e2e/
        └── smoke.spec.tsx        # E2E tests
```

## Configuration

Key agents use `gemini-2.5-flash` model. Customize by modifying:
- `model` parameter in agent definitions
- `instruction` prompts for different agent behaviors
- Tool selection (currently uses Google Search)

## Output

The system generates a concise, bulleted summary with:
- Area and weather information
- Child ages
- 3-5 key activity recommendations
- Disclaimer about AI-generated results

### Sample Output

<img width="689" height="359" alt="Sample Output 1" src="https://github.com/user-attachments/assets/e40ef150-2971-473c-ae3b-5fa124dd8d4e" />

<img width="679" height="397" alt="Sample Output 2" src="https://github.com/user-attachments/assets/82c96902-fbbb-41cc-b9b5-36b6fbd4758d" />

<img width="686" height="437" alt="Sample Output 3" src="https://github.com/user-attachments/assets/c58a1a5d-71ee-4321-bd9a-49ca7d4e72b8" />

## UI Design

### Color Scheme

The application uses a **dark blue primary color** scheme that meets **WCAG AA accessibility standards**:

| Color | Hex Code | Usage | Contrast Ratio |
|-------|----------|-------|----------------|
| Primary (Dark Blue) | `#1e3a5f` | Buttons, headers, accents | 10.5:1 on white |
| Background | `#ffffff` | Page background | — |
| Text | `#1e3a5f` | Primary text | 10.5:1 on white |

### Accessibility

- **WCAG AA Compliant**: All text meets the minimum 4.5:1 contrast ratio requirement
- **Dark Blue Theme**: Provides excellent readability and professional appearance
- **High Contrast**: 10.5:1 ratio significantly exceeds WCAG AA requirements (4.5:1)

## Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| **CORS Error** | Backend not running or wrong URL | Ensure backend is running on port 8000; check `VITE_API_BASE_URL` in `.env.local` |
| **API Connection Failed** | Backend server not started | Start backend with `adk web` before running frontend |
| **"GOOGLE_API_KEY not set"** | Missing environment variable | Create `.env` file with valid `GOOGLE_API_KEY` |
| **Session Creation Failed** | Invalid API endpoint | Verify backend is running and endpoint format is correct |
| **Invalid Age Format** | Wrong input format | Use comma-separated integers (e.g., "5, 8, 12"), ages must be 1-119 |
| **Empty Plan Response** | Session not created | Ensure session creation succeeds before sending message |
| **npm install fails** | Node.js version mismatch | Update Node.js to version 18.x or higher |
| **Python import errors** | Missing dependencies | Run `pip install -r requirements.txt` in activated venv |
| **Port already in use** | Another process using port | Kill the process or change port in configuration |
| **Build errors** | Missing dependencies | Delete `node_modules` and run `npm install` again |

### Debugging Tips

1. **Check Network Tab**: Open browser DevTools → Network tab to inspect API requests
2. **Verify Session Flow**: Ensure session creation (empty body POST) returns 200 before plan request
3. **Console Logs**: Check browser console for JavaScript errors
4. **Backend Logs**: Check terminal running `adk web` for backend errors

### Environment Verification

```bash
# Verify all services are running
curl http://localhost:8000/  # Should return API info

# Test session creation
curl -X POST "http://localhost:8000/apps/WeekendPlanner/users/user-1/sessions/test-session" \
  -H "Content-Type: application/json" \
  -d '{}'

# Check frontend is accessible
curl http://localhost:5173/  # Should return HTML
```

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Review backend terminal output for API errors
3. Ensure all environment variables are correctly set
4. Verify Node.js and Python versions meet prerequisites

## Support

For issues or questions, please open an issue on GitHub.
