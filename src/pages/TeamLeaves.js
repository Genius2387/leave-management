import React, { Component } from 'react';
import { observer } from 'mobx-react';
import AppContext from '../context/AppContext';
import leaveApi from '../api/leaveApi';
import withRouter from '../utils/withRouter';

const STATUS_COLORS = {
  Pending: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  Approved: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
};

const s = {
  page: {
    maxWidth: '1050px',
    margin: '0 auto',
    padding: '16px',
  },
  heading: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '4px',
  },
  subheading: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
  },
  filterBar: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
    flex: '1',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '9px 12px',
    borderRadius: '7px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#F9FAFB',
    cursor: 'pointer',
    outline: 'none',
  },
  clearBtn: {
    padding: '9px 16px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'middle',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
  },
  approveBtn: {
    padding: '6px 14px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '6px 14px',
    backgroundColor: '#DC2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6B7280',
  },
  loadingWrap: {
    textAlign: 'center',
    padding: '48px',
    color: '#6B7280',
    fontSize: '16px',
  },
  errorAlert: {
    padding: '14px 18px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '8px',
    border: '1px solid #FECACA',
    marginBottom: '16px',
  },
  successAlert: {
    padding: '12px 16px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '8px',
    border: '1px solid #A7F3D0',
    marginBottom: '16px',
    fontSize: '14px',
  },
  resultCount: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '8px',
    paddingLeft: '2px',
  },
};

class TeamLeaves extends Component {
  static contextType = AppContext;

  state = {
    leaves: [],
    loading: true,
    error: null,
    actionSuccess: null,
    actionLoading: null, // id of leave being actioned
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  componentDidMount() {
    this.fetchLeaves();
  }

  componentDidUpdate(prevProps) {
    // Re-fetch whenever URL query string changes (filter changed)
    if (prevProps.location.search !== this.props.location.search) {
      this.fetchLeaves();
    }
  }

  // ── URL param helpers (no useSearchParams hook) ───────────────────────────

  getFiltersFromUrl() {
    // Manually parse location.search — intentionally NOT using useSearchParams hook
    const params = new URLSearchParams(this.props.location.search);
    return {
      employee: params.get('employee') || '',
      status: params.get('status') || '',
    };
  }

  updateUrlFilter(key, value) {
    const params = new URLSearchParams(this.props.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    // Navigate updates the URL; componentDidUpdate triggers re-fetch
    this.props.navigate(query ? `?${query}` : '/team-leaves');
  }

  clearFilters = () => {
    this.props.navigate('/team-leaves');
  };

  // ── API ────────────────────────────────────────────────────────────────────

  fetchLeaves = async () => {
    const { employee, status } = this.getFiltersFromUrl();

    // Build filter params for the API call
    // json-server: ?employeeName=Alice+Johnson&status=Pending
    // Requirement: always refetch from API when filters change — never filter locally
    const apiFilters = {};
    if (employee) apiFilters.employeeName = employee;
    if (status) apiFilters.status = status;

    this.setState({ loading: true, error: null });
    try {
      const leaves = await leaveApi.getLeaves(apiFilters);
      this.setState({ leaves, loading: false });
    } catch (err) {
      console.error('Failed to fetch team leaves:', err);
      this.setState({
        error: 'Failed to load team leaves. Is the JSON server running?',
        loading: false,
      });
    }
  };

  handleAction = async (leave, action) => {
    const store = this.context;
    this.setState({ actionLoading: leave.id, actionSuccess: null, error: null });

    try {
      const updated = await leaveApi.updateLeaveStatus(leave.id, action);

      // If rejecting, restore the employee's leave balance
      if (action === 'Rejected') {
        const emp = store.employees.find((e) => e.id === leave.employeeId);
        if (emp) {
          const newBalance = emp.leaveBalance + leave.totalDays;
          const updatedEmp = await leaveApi.updateEmployeeBalance(emp.id, newBalance);
          store.updateEmployee(updatedEmp);
        }
      }

      // Update local state + MobX store
      this.setState((prev) => ({
        leaves: prev.leaves.map((l) => (l.id === leave.id ? updated : l)),
        actionLoading: null,
        actionSuccess: `Leave for ${leave.employeeName} has been ${action.toLowerCase()}.`,
      }));
      store.updateLeaveStatus(leave.id, action);
    } catch (err) {
      console.error('Action failed:', err);
      this.setState({
        error: `Failed to ${action.toLowerCase()} leave. Please try again.`,
        actionLoading: null,
      });
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  getUniqueEmployees() {
    const store = this.context;
    return store.employees.map((e) => e.name);
  }

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  render() {
    const { leaves, loading, error, actionSuccess, actionLoading } = this.state;
    const { employee: empFilter, status: statusFilter } = this.getFiltersFromUrl();
    const hasFilters = empFilter || statusFilter;
    const employees = this.getUniqueEmployees();

    return (
      <div style={s.page}>
        <h1 style={s.heading}>Team Leave Requests</h1>
        <p style={s.subheading}>Review and act on your team's leave requests.</p>

        {/* Filter bar */}
        <div style={s.filterBar} role="search" aria-label="Filter leave requests">
          <div style={s.filterGroup}>
            <label style={s.filterLabel} htmlFor="emp-filter">Employee</label>
            <select
              id="emp-filter"
              style={s.select}
              value={empFilter}
              onChange={(e) => this.updateUrlFilter('employee', e.target.value)}
              data-testid="employee-filter"
              aria-label="Filter by employee"
            >
              <option value="">All Employees</option>
              {employees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel} htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              style={s.select}
              value={statusFilter}
              onChange={(e) => this.updateUrlFilter('status', e.target.value)}
              data-testid="status-filter"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Approved">✅ Approved</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          {hasFilters && (
            <button
              style={s.clearBtn}
              onClick={this.clearFilters}
              data-testid="clear-filters"
              aria-label="Clear all filters"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div style={s.errorAlert} role="alert" data-testid="error-alert">❌ {error}</div>
        )}
        {actionSuccess && (
          <div style={s.successAlert} role="status" data-testid="action-success">
            ✅ {actionSuccess}
          </div>
        )}

        {loading ? (
          <div style={s.loadingWrap}>⏳ Loading team leaves…</div>
        ) : (
          <>
            <p style={s.resultCount} data-testid="result-count">
              {leaves.length} request{leaves.length !== 1 ? 's' : ''}
              {hasFilters ? ' matching filters' : ' total'}
            </p>

            <div style={s.tableWrapper}>
              {leaves.length === 0 ? (
                <div style={s.emptyState} data-testid="empty-state">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                    No results found
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {hasFilters ? 'Try adjusting or clearing the filters.' : 'No leave requests submitted yet.'}
                  </div>
                </div>
              ) : (
                <table style={s.table} data-testid="team-leaves-table">
                  <thead>
                    <tr>
                      {['Employee', 'Dept', 'Start', 'End', 'Days', 'Reason', 'Status', 'Applied', 'Actions'].map(
                        (h) => <th key={h} style={s.th}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave, idx) => {
                      const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.Pending;
                      const isActioning = actionLoading === leave.id;
                      const isPending = leave.status === 'Pending';

                      return (
                        <tr
                          key={leave.id}
                          data-testid={`team-row-${leave.id}`}
                          style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}
                        >
                          <td style={{ ...s.td, fontWeight: '500' }}>{leave.employeeName}</td>
                          <td style={{ ...s.td, color: '#6B7280' }}>{leave.department}</td>
                          <td style={s.td}>{this.formatDate(leave.startDate)}</td>
                          <td style={s.td}>{this.formatDate(leave.endDate)}</td>
                          <td style={{ ...s.td, fontWeight: '600', color: '#4F46E5' }}>
                            {leave.totalDays}d
                          </td>
                          <td style={{ ...s.td, maxWidth: '160px' }}>
                            <span
                              title={leave.reason}
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '160px',
                              }}
                            >
                              {leave.reason}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                ...s.statusBadge,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: colors.border,
                              }}
                              data-testid={`status-badge-${leave.id}`}
                            >
                              {leave.status}
                            </span>
                          </td>
                          <td style={{ ...s.td, color: '#6B7280', fontSize: '13px' }}>
                            {this.formatDate(leave.appliedOn)}
                          </td>
                          <td style={s.td}>
                            {isPending ? (
                              <div style={s.actionRow}>
                                <button
                                  style={{
                                    ...s.approveBtn,
                                    ...(isActioning ? s.disabledBtn : {}),
                                  }}
                                  disabled={isActioning}
                                  onClick={() => this.handleAction(leave, 'Approved')}
                                  data-testid={`approve-btn-${leave.id}`}
                                  aria-label={`Approve leave for ${leave.employeeName}`}
                                >
                                  {isActioning ? '…' : '✓ Approve'}
                                </button>
                                <button
                                  style={{
                                    ...s.rejectBtn,
                                    ...(isActioning ? s.disabledBtn : {}),
                                  }}
                                  disabled={isActioning}
                                  onClick={() => this.handleAction(leave, 'Rejected')}
                                  data-testid={`reject-btn-${leave.id}`}
                                  aria-label={`Reject leave for ${leave.employeeName}`}
                                >
                                  {isActioning ? '…' : '✗ Reject'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}

export default withRouter(observer(TeamLeaves));
