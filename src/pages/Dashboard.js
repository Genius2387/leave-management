import React, { Component } from 'react';
import { observer } from 'mobx-react';
import AppContext from '../context/AppContext';
import leaveApi from '../api/leaveApi';
import withRouter from '../utils/withRouter';

const s = {
  page: {
    maxWidth: '1100px',
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
    marginBottom: '28px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #F3F4F6',
  },
  cardIcon: {
    fontSize: '36px',
    lineHeight: '1',
    flexShrink: 0,
  },
  cardContent: {
    minWidth: 0,
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '20px',
  },
  chartWrap: {
    overflowX: 'auto',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#374151',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '12px 14px',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
  },
  progressBar: {
    height: '8px',
    borderRadius: '999px',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: '4px',
    minWidth: '80px',
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
};

// Colours for stacked bar chart segments
const BAR_COLORS = {
  Approved: '#059669',
  Pending: '#D97706',
  Rejected: '#DC2626',
};

class Dashboard extends Component {
  static contextType = AppContext;

  state = {
    leaves: [],
    employees: [],
    loading: true,
    error: null,
  };

  async componentDidMount() {
    await this.fetchData();
  }

  fetchData = async () => {
    this.setState({ loading: true, error: null });
    try {
      const [leaves, employees] = await Promise.all([
        leaveApi.getLeaves(),
        leaveApi.getEmployees(),
      ]);
      this.setState({ leaves, employees, loading: false });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      this.setState({
        error: 'Failed to load dashboard data. Is the JSON server running?',
        loading: false,
      });
    }
  };

  // ── Data aggregation helpers ───────────────────────────────────────────────

  getSummary(leaves) {
    return {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === 'Approved').length,
      pending: leaves.filter((l) => l.status === 'Pending').length,
      rejected: leaves.filter((l) => l.status === 'Rejected').length,
      totalDays: leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0),
    };
  }

  getPerEmployeeStats(leaves, employees) {
    return employees.map((emp) => {
      const empLeaves = leaves.filter((l) => l.employeeId === emp.id);
      return {
        name: emp.name,
        department: emp.department,
        approved: empLeaves.filter((l) => l.status === 'Approved').length,
        pending: empLeaves.filter((l) => l.status === 'Pending').length,
        rejected: empLeaves.filter((l) => l.status === 'Rejected').length,
        total: empLeaves.length,
        totalDays: empLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0),
        balance: emp.leaveBalance,
      };
    });
  }

  getDeptStats(leaves) {
    const deptMap = {};
    leaves.forEach((l) => {
      if (!deptMap[l.department]) {
        deptMap[l.department] = { Approved: 0, Pending: 0, Rejected: 0 };
      }
      deptMap[l.department][l.status] = (deptMap[l.department][l.status] || 0) + 1;
    });
    return Object.entries(deptMap).map(([dept, counts]) => ({
      dept,
      ...counts,
      total: (counts.Approved || 0) + (counts.Pending || 0) + (counts.Rejected || 0),
    }));
  }

  // ── SVG Stacked Bar Chart ──────────────────────────────────────────────────

  renderBarChart(perEmployee) {
    const chartWidth = 660;
    const chartHeight = 240;
    const paddingLeft = 90;
    const paddingRight = 20;
    const paddingTop = 16;
    const paddingBottom = 50;
    const barAreaWidth = chartWidth - paddingLeft - paddingRight;
    const barAreaHeight = chartHeight - paddingTop - paddingBottom;

    const maxTotal = Math.max(...perEmployee.map((e) => e.total), 1);
    const barWidth = Math.min(48, (barAreaWidth / perEmployee.length) * 0.55);
    const gap = barAreaWidth / perEmployee.length;

    // Y-axis ticks
    const yTicks = [0, Math.ceil(maxTotal / 4), Math.ceil(maxTotal / 2), Math.ceil(maxTotal * 3 / 4), maxTotal];

    return (
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', maxWidth: `${chartWidth}px`, minWidth: '320px', display: 'block' }}
        role="img"
        aria-label="Stacked bar chart: leaves per employee"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = paddingTop + barAreaHeight - (tick / maxTotal) * barAreaHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9CA3AF"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {perEmployee.map((emp, i) => {
          const centerX = paddingLeft + gap * i + gap / 2;
          const barX = centerX - barWidth / 2;
          let yOffset = paddingTop + barAreaHeight;

          const segments = [
            { key: 'Rejected', value: emp.rejected },
            { key: 'Pending', value: emp.pending },
            { key: 'Approved', value: emp.approved },
          ];

          const bars = segments.map(({ key, value }) => {
            if (value === 0) return null;
            const segHeight = (value / maxTotal) * barAreaHeight;
            yOffset -= segHeight;
            return (
              <rect
                key={key}
                x={barX}
                y={yOffset}
                width={barWidth}
                height={segHeight}
                fill={BAR_COLORS[key]}
                rx="3"
              >
                <title>{emp.name}: {value} {key}</title>
              </rect>
            );
          });

          // Total label on top
          const topY = paddingTop + barAreaHeight - (emp.total / maxTotal) * barAreaHeight - 6;

          // X label
          const firstName = emp.name.split(' ')[0];

          return (
            <g key={emp.name}>
              {bars}
              {emp.total > 0 && (
                <text x={centerX} y={topY} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">
                  {emp.total}
                </text>
              )}
              <text
                x={centerX}
                y={chartHeight - paddingBottom + 16}
                textAnchor="middle"
                fontSize="12"
                fill="#6B7280"
              >
                {firstName}
              </text>
              <text
                x={centerX}
                y={chartHeight - paddingBottom + 30}
                textAnchor="middle"
                fontSize="10"
                fill="#9CA3AF"
              >
                {emp.department}
              </text>
            </g>
          );
        })}

        {/* X axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + barAreaHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + barAreaHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        {/* Y axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + barAreaHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      </svg>
    );
  }

  render() {
    const { leaves, employees, loading, error } = this.state;

    if (loading) {
      return (
        <div style={s.page}>
          <div style={s.loadingWrap}>⏳ Loading dashboard…</div>
        </div>
      );
    }

    const summary = this.getSummary(leaves);
    const perEmployee = this.getPerEmployeeStats(leaves, employees);
    const deptStats = this.getDeptStats(leaves);

    const summaryCards = [
      { label: 'Total Requests', value: summary.total, icon: '📋', color: '#4F46E5' },
      { label: 'Approved', value: summary.approved, icon: '✅', color: '#059669' },
      { label: 'Pending', value: summary.pending, icon: '⏳', color: '#D97706' },
      { label: 'Rejected', value: summary.rejected, icon: '❌', color: '#DC2626' },
      { label: 'Total Leave Days', value: summary.totalDays, icon: '📆', color: '#7C3AED' },
    ];

    return (
      <div style={s.page}>
        <h1 style={s.heading}>Admin Dashboard</h1>
        <p style={s.subheading}>
          Organisation-wide leave overview · {new Date().getFullYear()}
        </p>

        {error && (
          <div style={s.errorAlert} role="alert">❌ {error}</div>
        )}

        {/* ── Summary Cards ─────────────────────────────────────────────────── */}
        <div style={s.cardsGrid} data-testid="summary-cards">
          {summaryCards.map(({ label, value, icon, color }) => (
            <div key={label} style={s.card}>
              <span style={s.cardIcon}>{icon}</span>
              <div style={s.cardContent}>
                <div style={{ ...s.cardValue, color }} data-testid={`card-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                  {value}
                </div>
                <div style={s.cardLabel}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bar Chart: Leaves per Employee ────────────────────────────────── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Leaves per Employee</div>
          <div style={s.sectionSub}>Stacked by status — Approved / Pending / Rejected</div>

          {/* Legend */}
          <div style={s.legend}>
            {Object.entries(BAR_COLORS).map(([status, color]) => (
              <div key={status} style={s.legendItem}>
                <div style={{ ...s.legendDot, backgroundColor: color }} />
                {status}
              </div>
            ))}
          </div>

          <div style={s.chartWrap} data-testid="bar-chart">
            {perEmployee.length > 0
              ? this.renderBarChart(perEmployee)
              : <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No data to display.</p>
            }
          </div>
        </div>

        {/* ── Employee Summary Table ─────────────────────────────────────────── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Employee Leave Summary</div>
          <div style={s.sectionSub}>Detailed breakdown per employee</div>

          <div style={s.tableWrapper}>
            <table style={s.table} data-testid="employee-summary-table">
              <thead>
                <tr>
                  {['Employee', 'Department', 'Approved', 'Pending', 'Rejected', 'Total', 'Balance Used', 'Balance Left'].map(
                    (h) => <th key={h} style={s.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {perEmployee.map((emp, idx) => {
                  const usedDays = 24 - emp.balance;
                  const usedPct = Math.min((usedDays / 24) * 100, 100);
                  return (
                    <tr key={emp.name} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ ...s.td, fontWeight: '500' }}>{emp.name}</td>
                      <td style={{ ...s.td, color: '#6B7280' }}>{emp.department}</td>
                      <td style={{ ...s.td, color: '#059669', fontWeight: '600' }}>{emp.approved}</td>
                      <td style={{ ...s.td, color: '#D97706', fontWeight: '600' }}>{emp.pending}</td>
                      <td style={{ ...s.td, color: '#DC2626', fontWeight: '600' }}>{emp.rejected}</td>
                      <td style={{ ...s.td, fontWeight: '600' }}>{emp.total}</td>
                      <td style={s.td}>
                        <div style={{ fontSize: '13px', color: '#374151' }}>{usedDays}/24 days</div>
                        <div style={s.progressBar}>
                          <div
                            style={{
                              height: '100%',
                              width: `${usedPct}%`,
                              backgroundColor: usedPct > 80 ? '#DC2626' : usedPct > 50 ? '#D97706' : '#059669',
                              borderRadius: '999px',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ ...s.td, fontWeight: '600', color: emp.balance <= 5 ? '#DC2626' : '#4F46E5' }}>
                        {emp.balance} days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Department Stats ──────────────────────────────────────────────── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>By Department</div>
          <div style={s.sectionSub}>Leave request counts grouped by department</div>

          <div style={s.tableWrapper}>
            <table style={s.table} data-testid="dept-table">
              <thead>
                <tr>
                  {['Department', 'Approved', 'Pending', 'Rejected', 'Total'].map(
                    (h) => <th key={h} style={s.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {deptStats.map((row, idx) => (
                  <tr key={row.dept} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ ...s.td, fontWeight: '500' }}>{row.dept}</td>
                    <td style={{ ...s.td, color: '#059669', fontWeight: '600' }}>{row.Approved || 0}</td>
                    <td style={{ ...s.td, color: '#D97706', fontWeight: '600' }}>{row.Pending || 0}</td>
                    <td style={{ ...s.td, color: '#DC2626', fontWeight: '600' }}>{row.Rejected || 0}</td>
                    <td style={{ ...s.td, fontWeight: '600' }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(observer(Dashboard));
