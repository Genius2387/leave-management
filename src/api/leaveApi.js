import got from './got';

/**
 * leaveApi.js
 * Centralised API functions that use the got wrapper.
 * All network calls go through here; components remain decoupled from fetch logic.
 */

const leaveApi = {
  // ── Server Time ─────────────────────────────────────────────────────────────

  async getServerTime() {
    const res = await got.get('/server-time');
    return res.json(); // { time: ISO string }
  },

  // ── Employees ────────────────────────────────────────────────────────────────

  async getEmployees() {
    const res = await got.get('/employees');
    return res.json(); // Employee[]
  },

  async getEmployee(id) {
    const res = await got.get(`/employees/${id}`);
    return res.json();
  },

  async updateEmployeeBalance(id, newBalance) {
    const res = await got.patch(`/employees/${id}`, {
      json: { leaveBalance: newBalance },
    });
    return res.json();
  },

  // ── Leaves ───────────────────────────────────────────────────────────────────

  /**
   * Fetch leaves with optional filters.
   * Filters are always passed as query params (never filtered locally).
   * json-server supports: ?employeeId=X&status=Y
   */
  async getLeaves(filters = {}) {
    const res = await got.get('/leaves', { searchParams: filters });
    return res.json(); // Leave[]
  },

  /**
   * Fetch leaves for a single employee.
   */
  async getLeavesForEmployee(employeeId) {
    const res = await got.get('/leaves', {
      searchParams: { employeeId },
    });
    return res.json();
  },

  /**
   * Apply (create) a new leave request.
   */
  async applyLeave(leavePayload) {
    const res = await got.post('/leaves', { json: leavePayload });
    return res.json(); // created Leave object (with id assigned by json-server)
  },

  /**
   * Update a leave's status (Approved / Rejected).
   */
  async updateLeaveStatus(id, status) {
    const res = await got.patch(`/leaves/${id}`, { json: { status } });
    return res.json();
  },
};

export default leaveApi;
