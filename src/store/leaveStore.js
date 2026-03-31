import { makeObservable, observable, action, computed } from 'mobx';

// Role → default employeeId mapping (simulates login)
const ROLE_EMPLOYEE_MAP = {
  employee: '1',
  manager: '2',
  admin: '3',
};

class LeaveStore {
  employees = [];
  leaves = [];
  currentRole = 'employee';
  currentEmployeeId = '1';
  loading = false;
  error = null;

  constructor() {
    makeObservable(this, {
      employees: observable,
      leaves: observable,
      currentRole: observable,
      currentEmployeeId: observable,
      loading: observable,
      error: observable,

      // Actions
      setRole: action,
      setEmployees: action,
      setLeaves: action,
      addLeave: action,
      updateLeaveStatus: action,
      setLoading: action,
      setError: action,
      updateEmployee: action,

      // Computed
      currentEmployee: computed,
      leaveBalance: computed,
      totalLeaves: computed,
      approvedLeaves: computed,
      pendingLeaves: computed,
      rejectedLeaves: computed,
    });
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  get currentEmployee() {
    return this.employees.find((e) => e.id === this.currentEmployeeId) || null;
  }

  get leaveBalance() {
    return this.currentEmployee ? this.currentEmployee.leaveBalance : 0;
  }

  get totalLeaves() {
    return this.leaves.length;
  }

  get approvedLeaves() {
    return this.leaves.filter((l) => l.status === 'Approved').length;
  }

  get pendingLeaves() {
    return this.leaves.filter((l) => l.status === 'Pending').length;
  }

  get rejectedLeaves() {
    return this.leaves.filter((l) => l.status === 'Rejected').length;
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  setRole(role) {
    this.currentRole = role;
    this.currentEmployeeId = ROLE_EMPLOYEE_MAP[role] || '1';
  }

  setEmployees(employees) {
    this.employees = employees;
  }

  setLeaves(leaves) {
    this.leaves = leaves;
  }

  addLeave(leave) {
    this.leaves.push(leave);
  }

  /**
   * Update a leave record's status in the local store.
   * The API call is handled by the component; this keeps the store in sync.
   */
  updateLeaveStatus(id, status) {
    const idx = this.leaves.findIndex((l) => l.id === id);
    if (idx !== -1) {
      // MobX requires direct mutation of observable arrays
      this.leaves[idx] = { ...this.leaves[idx], status };
    }
  }

  updateEmployee(updatedEmployee) {
    const idx = this.employees.findIndex((e) => e.id === updatedEmployee.id);
    if (idx !== -1) {
      this.employees[idx] = { ...updatedEmployee };
    }
  }

  setLoading(val) {
    this.loading = val;
  }

  setError(err) {
    this.error = err;
  }
}

// Singleton store instance
const leaveStore = new LeaveStore();
export default leaveStore;
