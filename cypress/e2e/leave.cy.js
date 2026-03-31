/**
 * Cypress E2E Tests — Leave Management System
 *
 * Prerequisites before running:
 *   1. JSON server must be running: npm run server  (port 3001)
 *   2. React app must be running:   npm run start   (port 3000)
 *      OR run both together:         npm run dev
 *
 * Run tests:
 *   npx cypress open    # interactive mode
 *   npx cypress run     # headless CI mode
 */

describe('Leave Management – E2E Tests', () => {
  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatDate(date) {
    // Returns YYYY-MM-DD for input[type="date"]
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }

  function getFutureDate(daysAhead = 7) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return formatDate(d);
  }

  // ── Suite 1: Apply Leave – Validation ─────────────────────────────────────

  describe('Apply Leave Validation', () => {
    beforeEach(() => {
      // Ensure we are in Employee role
      cy.visit('/apply-leave');
      // Wait for page to hydrate
      cy.get('[data-testid="role-switcher"]').select('employee');
      cy.get('[data-testid="start-date"]').should('exist');
    });

    /**
     * Test 1 (Core requirement): Back-dated leave application must fail.
     * The app calls /server-time and compares the start date against it.
     */
    it('rejects a leave application with a past start date', () => {
      const yesterday = getYesterdayStr();
      const today = formatDate(new Date());

      // Fill in a past start date
      cy.get('[data-testid="start-date"]').type(yesterday);
      cy.get('[data-testid="end-date"]').type(today);
      cy.get('[data-testid="reason"]').type('Testing past date rejection');

      // Submit
      cy.get('[data-testid="submit-btn"]').click();

      // Error message must mention "past" or similar wording
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain.text', 'past');

      // Success message should NOT appear
      cy.get('[data-testid="success-message"]').should('not.exist');
    });

    it('rejects when end date is before start date', () => {
      const start = getFutureDate(10);
      const end = getFutureDate(5); // earlier than start

      cy.get('[data-testid="start-date"]').type(start);
      cy.get('[data-testid="end-date"]').type(end);
      cy.get('[data-testid="reason"]').type('Invalid date range');

      cy.get('[data-testid="submit-btn"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain.text', 'End date');
    });

    it('rejects submission when required fields are empty', () => {
      // Click submit without filling anything
      cy.get('[data-testid="submit-btn"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain.text', 'required');
    });

    it('successfully submits a valid future leave', () => {
      const start = getFutureDate(14);
      const end = getFutureDate(15);

      cy.get('[data-testid="start-date"]').type(start);
      cy.get('[data-testid="end-date"]').type(end);
      cy.get('[data-testid="reason"]').type('Annual family trip');

      cy.get('[data-testid="submit-btn"]').click();

      // Expect success (may take a moment for API call)
      cy.get('[data-testid="success-message"]', { timeout: 8000 })
        .should('be.visible')
        .and('contain.text', 'Leave applied');
    });
  });

  // ── Suite 2: URL-Driven Filters ────────────────────────────────────────────

  describe('Team Leaves – URL-driven filter persistence', () => {
    beforeEach(() => {
      // Switch to manager role so Team Leaves tab is visible
      cy.visit('/team-leaves');
      cy.get('[data-testid="role-switcher"]').select('manager');
      cy.visit('/team-leaves');
    });

    /**
     * Test 2 (Core requirement): Filters must persist after page refresh.
     * Filter state lives in the URL, so a reload restores them automatically.
     */
    it('persists employee and status filters across a hard refresh', () => {
      // Apply employee filter
      cy.get('[data-testid="employee-filter"]').select('Alice Johnson');

      // URL should now contain ?employee=Alice+Johnson
      cy.url().should('include', 'employee=');

      // Apply status filter
      cy.get('[data-testid="status-filter"]').select('Pending');

      // URL should contain both params
      cy.url().should('include', 'employee=').and('include', 'status=Pending');

      // Hard reload — filters must survive
      cy.reload();

      // Dropdowns should still reflect the previously selected values
      cy.get('[data-testid="employee-filter"]')
        .should('have.value', 'Alice Johnson');

      cy.get('[data-testid="status-filter"]')
        .should('have.value', 'Pending');
    });

    it('loads a shared URL with pre-applied filters', () => {
      // Simulate someone sharing a URL with filters already in query string
      cy.visit('/team-leaves?employee=Bob%20Smith&status=Approved');

      cy.get('[data-testid="employee-filter"]')
        .should('have.value', 'Bob Smith');

      cy.get('[data-testid="status-filter"]')
        .should('have.value', 'Approved');
    });

    it('clears filters when "Clear Filters" button is clicked', () => {
      cy.visit('/team-leaves?status=Pending');

      cy.get('[data-testid="status-filter"]').should('have.value', 'Pending');

      cy.get('[data-testid="clear-filters"]').click();

      // Both filters reset
      cy.get('[data-testid="employee-filter"]').should('have.value', '');
      cy.get('[data-testid="status-filter"]').should('have.value', '');

      // URL should no longer have filter params
      cy.url().should('not.include', 'status=');
    });
  });

  // ── Suite 3: Manager Actions ───────────────────────────────────────────────

  describe('Manager – approve and reject leaves', () => {
    before(() => {
      cy.visit('/team-leaves');
      cy.get('[data-testid="role-switcher"]').select('manager');
    });

    it('shows Approve and Reject buttons only for Pending leaves', () => {
      cy.visit('/team-leaves?status=Pending');

      cy.get('[data-testid="team-leaves-table"]').within(() => {
        // At least one approve button must exist for pending rows
        cy.get('[data-testid^="approve-btn-"]').should('exist');
        cy.get('[data-testid^="reject-btn-"]').should('exist');
      });
    });
  });

  // ── Suite 4: Navigation & Role Switching ──────────────────────────────────

  describe('Navigation and role switcher', () => {
    it('shows correct nav items for each role', () => {
      cy.visit('/apply-leave');

      // Employee role
      cy.get('[data-testid="role-switcher"]').select('employee');
      cy.get('[data-testid="nav-apply"]').should('be.visible');
      cy.get('[data-testid="nav-my-leaves"]').should('be.visible');

      // Manager role
      cy.get('[data-testid="role-switcher"]').select('manager');
      cy.get('[data-testid="nav-team"]').should('be.visible');

      // Admin role
      cy.get('[data-testid="role-switcher"]').select('admin');
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
    });

    it('shows leave balance only in employee role', () => {
      cy.visit('/apply-leave');

      cy.get('[data-testid="role-switcher"]').select('employee');
      cy.get('[data-testid="leave-balance"]').should('be.visible');

      cy.get('[data-testid="role-switcher"]').select('manager');
      cy.get('[data-testid="leave-balance"]').should('not.exist');
    });
  });
});
