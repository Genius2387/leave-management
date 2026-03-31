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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
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
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  statNum: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
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
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '6px',
    color: '#374151',
    fontWeight: '500',
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
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

class MyLeaves extends Component {
  static contextType = AppContext;

  state = {
    leaves: [],
    loading: true,
    error: null,
  };

  async componentDidMount() {
    await this.fetchLeaves();
  }

  async componentDidUpdate(prevProps) {
    // Re-fetch if the logged-in employee changes (role switch)
    const prevEmployee = this.context.currentEmployeeId;
    if (prevEmployee !== this.context.currentEmployeeId) {
      await this.fetchLeaves();
    }
  }

  fetchLeaves = async () => {
    const store = this.context;
    const employee = store.currentEmployee;

    if (!employee) {
      this.setState({ loading: false, leaves: [] });
      return;
    }

    this.setState({ loading: true, error: null });
    try {
      const leaves = await leaveApi.getLeavesForEmployee(employee.id);
      this.setState({ leaves, loading: false });
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
      this.setState({ error: 'Failed to load leave history. Is the server running?', loading: false });
    }
  };

  computeStats(leaves) {
    return {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === 'Approved').length,
      pending: leaves.filter((l) => l.status === 'Pending').length,
      rejected: leaves.filter((l) => l.status === 'Rejected').length,
      totalDays: leaves
        .filter((l) => l.status === 'Approved')
        .reduce((sum, l) => sum + l.totalDays, 0),
    };
  }

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  render() {
    const store = this.context;
    const employee = store.currentEmployee;
    const { leaves, loading, error } = this.state;
    const stats = this.computeStats(leaves);

    if (loading) {
      return (
        <div style={s.page}>
          <div style={s.loadingWrap}>⏳ Loading your leave history…</div>
        </div>
      );
    }

    return (
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.heading}>My Leaves</h1>
            <p style={s.subheading}>
              Showing leaves for {employee ? employee.name : 'you'} · {new Date().getFullYear()}
            </p>
          </div>
          <button style={s.refreshBtn} onClick={this.fetchLeaves} data-testid="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div style={s.errorAlert} role="alert" data-testid="error-message">
            ❌ {error}
          </div>
        )}

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            { label: 'Total Requests', value: stats.total, icon: '📋' },
            { label: 'Approved', value: stats.approved, icon: '✅', color: '#059669' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: '#D97706' },
            { label: 'Rejected', value: stats.rejected, icon: '❌', color: '#DC2626' },
            { label: 'Days Taken', value: stats.totalDays, icon: '📆', color: '#4F46E5' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={s.statCard}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ ...s.statNum, ...(color ? { color } : {}) }}>{value}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={s.tableWrapper}>
          {leaves.length === 0 ? (
            <div style={s.emptyState} data-testid="empty-state">
              <div style={s.emptyIcon}>📭</div>
              <div style={s.emptyText}>No leave applications yet</div>
              <div style={{ fontSize: '14px' }}>Apply for your first leave using the Apply Leave tab.</div>
            </div>
          ) : (
            <table style={s.table} data-testid="leaves-table">
              <thead>
                <tr>
                  {['#', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied On'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave, idx) => {
                  const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.Pending;
                  return (
                    <tr
                      key={leave.id}
                      data-testid={`leave-row-${leave.id}`}
                      style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}
                    >
                      <td style={s.td}>{idx + 1}</td>
                      <td style={s.td}>{this.formatDate(leave.startDate)}</td>
                      <td style={s.td}>{this.formatDate(leave.endDate)}</td>
                      <td style={{ ...s.td, fontWeight: '600', color: '#4F46E5' }}>
                        {leave.totalDays}d
                      </td>
                      <td style={{ ...s.td, maxWidth: '200px' }}>
                        <span
                          title={leave.reason}
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(observer(MyLeaves));
