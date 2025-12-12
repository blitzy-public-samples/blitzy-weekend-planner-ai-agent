/**
 * End-to-end smoke tests for the Weekend Planner application
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import App from '../src/App';
import { server } from '../src/__mocks__/handlers';

// Note: These tests use mocked handlers from the test setup
// For true E2E testing with a live backend, use a tool like Playwright or Cypress

describe('Weekend Planner - Smoke Tests', () => {
  describe('Initial Rendering', () => {
    it('renders the application header', () => {
      render(<App />);

      expect(screen.getByRole('heading', { name: /weekend planner/i })).toBeInTheDocument();
      expect(screen.getByText(/plan the perfect family weekend with ai/i)).toBeInTheDocument();
    });

    it('renders the input form', () => {
      render(<App />);

      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument();
    });

    it('renders the empty state placeholder', () => {
      render(<App />);

      expect(screen.getByText(/plan your perfect weekend/i)).toBeInTheDocument();
      expect(screen.getByText(/enter your details and click generate plan/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('enables submit button when required fields are filled', async () => {
      const user = userEvent.setup();
      render(<App />);

      const submitButton = screen.getByRole('button', { name: /generate plan/i });
      expect(submitButton).toBeDisabled();

      await user.type(screen.getByLabelText(/location/i), 'San Francisco');
      await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
      await user.type(screen.getByLabelText(/end date/i), '2024-03-17');

      expect(submitButton).toBeEnabled();
    });

    it('shows loading state during plan generation', async () => {
      // Use a delayed response to ensure loading state is visible
      server.use(
        http.post('http://localhost:8000/run', async () => {
          await delay(500); // 500ms delay to make loading state visible
          return HttpResponse.json([
            {
              id: 'evt-delayed-001',
              timestamp: new Date().toISOString(),
              author: 'model',
              content: {
                role: 'model',
                parts: [{ text: 'Delayed test plan response' }]
              }
            }
          ]);
        })
      );

      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText(/location/i), 'San Francisco');
      await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
      await user.type(screen.getByLabelText(/end date/i), '2024-03-17');

      const submitButton = screen.getByRole('button', { name: /generate plan/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/creating your perfect weekend/i)).toBeInTheDocument();
      });
    });

    it('displays plan result after successful generation', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText(/location/i), 'San Francisco');
      await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
      await user.type(screen.getByLabelText(/end date/i), '2024-03-17');

      const submitButton = screen.getByRole('button', { name: /generate plan/i });
      await user.click(submitButton);

      // Wait for the plan to be displayed - use heading role for more specific query
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /your weekend plan/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('resets form and output on reset button click', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Fill in form
      await user.type(screen.getByLabelText(/location/i), 'San Francisco');
      await user.type(screen.getByLabelText(/start date/i), '2024-03-15');
      await user.type(screen.getByLabelText(/end date/i), '2024-03-17');

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Form should be cleared
      expect(screen.getByLabelText(/location/i)).toHaveValue('');
      expect(screen.getByLabelText(/start date/i)).toHaveValue('');
      expect(screen.getByLabelText(/end date/i)).toHaveValue('');

      // Empty state should be shown
      expect(screen.getByText(/plan your perfect weekend/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      render(<App />);

      const locationInput = screen.getByLabelText(/location/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      expect(locationInput).toHaveAccessibleName();
      expect(startDateInput).toHaveAccessibleName();
      expect(endDateInput).toHaveAccessibleName();
    });

    it('has accessible buttons', () => {
      render(<App />);

      const submitButton = screen.getByRole('button', { name: /generate plan/i });
      const resetButton = screen.getByRole('button', { name: /reset/i });

      expect(submitButton).toHaveAccessibleName();
      expect(resetButton).toHaveAccessibleName();
    });
  });
});
