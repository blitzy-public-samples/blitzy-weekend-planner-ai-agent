# Weekend Planner Frontend

A modern React 18.2.0 Single Page Application (SPA) built with Vite 5.x that provides a polished user interface for the Weekend Planner AI Agent. This frontend connects to the Google ADK-powered backend API to help families plan perfect weekend activities based on location, dates, children's ages, and preferences.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Connecting to the Backend](#connecting-to-the-backend)

## Prerequisites

Before getting started, ensure you have the following installed on your development machine:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 20.x LTS | Required runtime environment |
| **npm** | 10.x+ | Comes bundled with Node.js |

To verify your installations:

```bash
node --version  # Should output v20.x.x
npm --version   # Should output 10.x.x
```

You can download Node.js 20.x LTS from [nodejs.org](https://nodejs.org/).

## Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install all dependencies:

```bash
npm install
```

This will install all runtime and development dependencies defined in `package.json`, including:
- React 18.2.0 and React DOM
- Vite 5.x build tool
- TypeScript 5.x compiler
- Tailwind CSS 3.4.x for styling
- Vitest and React Testing Library for testing
- MSW 2.x for API mocking

## Development

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

This will:
- Start Vite's development server at `http://localhost:5173`
- Enable Fast Refresh for instant UI updates
- Configure proxy to route `/api` requests to the backend at `http://localhost:8000`
- Watch for file changes and rebuild automatically

Open your browser to [http://localhost:5173](http://localhost:5173) to view the application.

### Development Workflow

1. Ensure the backend ADK server is running (see [Connecting to the Backend](#connecting-to-the-backend))
2. Start the frontend development server with `npm run dev`
3. Make changes to source files in `src/`
4. Changes will automatically reflect in the browser

## Building

Create a production-optimized build:

```bash
npm run build
```

This command:
1. Runs the TypeScript compiler (`tsc`) to type-check all source files
2. Builds the production bundle using Vite
3. Outputs optimized assets to the `dist/` directory

The build will fail if there are any TypeScript errors, ensuring type safety in production.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This serves the `dist/` folder at `http://localhost:4173`.

## Testing

### Run All Tests

Execute the complete test suite:

```bash
npm run test
```

This runs Vitest in single-run mode with jsdom environment for DOM testing. All tests use MSW (Mock Service Worker) to mock API responses, ensuring tests run independently without requiring the backend server.

### Run Tests in Watch Mode

For development, run tests in watch mode:

```bash
npm run test:watch
```

Tests will automatically re-run when source or test files change.

### Code Coverage

Generate a comprehensive code coverage report:

```bash
npm run test:coverage
```

This produces coverage reports in multiple formats:
- **Terminal**: Summary displayed in console
- **JSON**: `coverage/coverage-final.json`
- **HTML**: `coverage/index.html` (open in browser for detailed view)

**Coverage Targets:**

| Metric | Minimum Threshold |
|--------|------------------|
| Lines | 80% |
| Branches | 80% |
| Functions | 80% |
| Statements | 80% |

### Interactive Test UI

Launch Vitest's interactive UI for a visual testing experience:

```bash
npm run test:ui
```

## Environment Configuration

The application uses environment variables for configuration. Copy the example file to create your local configuration:

```bash
cp .env.example .env.local
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for the ADK backend API |

### Configuration Modes

**Development Mode (Recommended):**

The Vite development server includes a proxy configuration that routes `/api` requests to the backend, avoiding CORS issues. With this setup, you typically don't need to set `VITE_API_BASE_URL`.

**Direct Connection Mode:**

If you prefer direct API calls without the proxy:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Note: This requires the backend to allow CORS from `http://localhost:5173`.

**Production Deployment:**

Set the environment variable to your production backend URL:

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

## Project Structure

```
frontend/
├── README.md                   # This file
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite build configuration
├── vitest.config.ts            # Vitest test configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── index.html                  # HTML entry point
├── .env.example                # Environment template
├── docs/                       # End-user documentation
│   ├── README.md
│   ├── getting-started.md
│   ├── user-guide.md
│   ├── troubleshooting.md
│   └── images/
├── src/
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Root component with state management
│   ├── index.css               # Global styles with Tailwind
│   ├── types.ts                # TypeScript type definitions
│   ├── api/
│   │   └── client.ts           # ADK API client functions
│   ├── components/
│   │   ├── InputForm.tsx       # User input form
│   │   ├── PlanView.tsx        # Plan display component
│   │   ├── RawOutput.tsx       # Collapsible raw response viewer
│   │   ├── LoadingState.tsx    # Loading skeleton component
│   │   └── ErrorDisplay.tsx    # Error display component
│   ├── __tests__/
│   │   ├── setup.ts            # Test environment setup
│   │   ├── api/
│   │   │   └── client.test.ts
│   │   └── components/
│   │       ├── InputForm.test.tsx
│   │       ├── PlanView.test.tsx
│   │       ├── RawOutput.test.tsx
│   │       ├── LoadingState.test.tsx
│   │       └── ErrorDisplay.test.tsx
│   └── __mocks__/
│       └── handlers.ts         # MSW request handlers
└── e2e/
    └── smoke.spec.ts           # End-to-end smoke tests
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with HMR |
| `build` | `npm run build` | Type-check and build for production |
| `preview` | `npm run preview` | Preview production build locally |
| `test` | `npm run test` | Run tests once |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |
| `test:coverage` | `npm run test:coverage` | Run tests with coverage report |
| `test:ui` | `npm run test:ui` | Open Vitest interactive UI |
| `lint` | `npm run lint` | Run TypeScript type checking |

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library with hooks and functional components |
| **React DOM** | 18.2.0 | React renderer for web |
| **TypeScript** | 5.x | Type-safe JavaScript development |
| **Vite** | 5.x | Fast build tool with HMR |
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework |
| **Vitest** | 1.6.x | Fast unit test framework |
| **React Testing Library** | 14.x | Component testing utilities |
| **MSW** | 2.x | API mocking for tests |

## Connecting to the Backend

The frontend requires the ADK backend server to be running for full functionality.

### Starting the Backend

From the repository root (not the frontend directory):

```bash
adk web
```

This starts the ADK server at `http://localhost:8000`.

### Full-Stack Development Setup

**Terminal 1 - Backend:**
```bash
# From repository root
adk web
# Server running at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Server running at http://localhost:5173
```

### API Endpoints Used

The frontend communicates with the following backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/apps/WeekendPlanner/users/{user}/sessions/{session}` | POST | Create a new session |
| `/run` | POST | Execute the AI agent with user input |

### Verifying the Connection

1. Open `http://localhost:5173` in your browser
2. Fill out the form with a location and date range
3. Click "Generate Plan"
4. You should see a loading state followed by AI-generated weekend plan recommendations

### Troubleshooting Connection Issues

**"Couldn't reach the backend" error:**
- Ensure the ADK server is running with `adk web`
- Verify the backend is accessible at `http://localhost:8000`
- Check that no firewall is blocking port 8000

**CORS errors in browser console:**
- The Vite proxy should handle CORS in development
- If using direct connection, ensure `VITE_API_BASE_URL` is set correctly
- Consider using the Vite proxy (default configuration) instead of direct connection

---

## Additional Resources

- [End-User Documentation](./docs/README.md) - Guides for using the application
- [Root README](../README.md) - Overall project documentation
- [React Documentation](https://react.dev/) - React 18 official docs
- [Vite Documentation](https://vitejs.dev/) - Vite build tool docs
- [Tailwind CSS Documentation](https://tailwindcss.com/) - Tailwind CSS utility classes
