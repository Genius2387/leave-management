import React, { Component } from 'react';
import { observer } from 'mobx-react';
import AppContext from '../context/AppContext';
import leaveApi from '../api/leaveApi';
import withRouter from '../utils/withRouter';

const s = {
  page: {
    maxWidth: '580px',
    margin: '0 auto',
    padding: '16px',
  },
  heading: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '6px',
  },
  subheading: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '15px',
    color: '#111827',
    backgroundColor: '#F9FAFB',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputReadOnly: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    cursor: 'not-allowed',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '15px',
    color: '#111827',
    backgroundColor: '#F9FAFB',
    outline: 'none',
    minHeight: '100px',
    resize: 'vertical',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.15s',
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
    cursor: 'not-allowed',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  alertError: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    border: '1px solid #FECACA',
  },
  alertSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  balanceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#EEF2FF',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #C7D2FE',
  },
  balanceInfoText: {
    fontSize: '14px',
    color: '#3730A3',
  },
  balanceNum: {
    fontWeight: '700',
    fontSize: '18px',
    color: '#4F46E5',
  },
};

class ApplyLeave extends Component {
  static contextType = AppContext;

  state = {
    startDate: '',
    endDate: '',
    reason: '',
    error: '',
    success: '',
    submitting: false,
  };

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value, error: '', success: '' });
  };

  calculateDays(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const store = this.context;
    const { startDate, endDate, reason } = this.state;

    this.setState({ error: '', success: '' });

    // Basic field validation
    if (!startDate || !endDate || !reason.trim()) {
      this.setState({ error: 'All fields are required.' });
      return;
    }

    try {
      const { time } = await leaveApi.getServerTime();
      const serverToday = new Date(time);
      serverToday.setHours(0, 0, 0, 0);

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start < serverToday) {
        this.setState({
          error: 'Start date cannot be in the past. Please select today or a future date.',
        });
        return;
      }

      if (end < start) {
        this.setState({
          error: 'End date must be on or after the start date.',
        });
        return;
      }

      const totalDays = this.calculateDays(startDate, endDate);
      const employee = store.currentEmployee;

      if (!employee) {
        this.setState({ error: 'No employee profile found. Please try again.' });
        return;
      }

      if (totalDays > employee.leaveBalance) {
        this.setState({
          error: `Insufficient balance. You requested ${totalDays} day(s) but only have ${employee.leaveBalance} day(s) left.`,
        });
        return;
      }

      this.setState({ submitting: true });

      // Create leave record via API
      const newLeave = {
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        startDate,
        endDate,
        reason: reason.trim(),
        status: 'Pending',
        totalDays,
        appliedOn: new Date().toISOString().split('T')[0],
      };

      const createdLeave = await leaveApi.applyLeave(newLeave);

      // Deduct balance via API
      const newBalance = employee.leaveBalance - totalDays;
      const updatedEmployee = await leaveApi.updateEmployeeBalance(employee.id, newBalance);

      // Update MobX store
      store.addLeave(createdLeave);
      store.updateEmployee(updatedEmployee);

      this.setState({
        success: `✅ Leave applied! ${totalDays} day(s) deducted. Remaining balance: ${newBalance} day(s).`,
        startDate: '',
        endDate: '',
        reason: '',
        submitting: false,
      });
    } catch (err) {
      console.error('Apply leave error:', err);
      this.setState({
        error: 'Failed to submit leave request. Please ensure the server is running.',
        submitting: false,
      });
    }
  };

  render() {
    const store = this.context;
    const employee = store.currentEmployee;
    const { startDate, endDate, reason, error, success, submitting } = this.state;
    const balance = employee ? employee.leaveBalance : 0;
    const isLowBalance = balance <= 5;

    let dayPreview = null;
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      const d = this.calculateDays(startDate, endDate);
      dayPreview = d;
    }

    return (
      <div style={s.page}>
        <h1 style={s.heading}>Apply for Leave</h1>
        <p style={s.subheading}>
          Submit a leave request. Your manager will review and approve or reject it.
        </p>

        {/* Balance info */}
        <div
          style={{
            ...s.balanceInfo,
            ...(isLowBalance
              ? { backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }
              : {}),
          }}
        >
          <span style={{ fontSize: '22px' }}>{isLowBalance ? '⚠️' : '🗓'}</span>
          <div>
            <div style={s.balanceInfoText}>
              Available Balance:{' '}
              <span
                style={{
                  ...s.balanceNum,
                  ...(isLowBalance ? { color: '#D97706' } : {}),
                }}
              >
                {balance}
              </span>{' '}
              day{balance !== 1 ? 's' : ''}
            </div>
            {dayPreview && (
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                This request: <strong>{dayPreview} day{dayPreview !== 1 ? 's' : ''}</strong>
                {' — '}Remaining after: <strong>{balance - dayPreview} day{balance - dayPreview !== 1 ? 's' : ''}</strong>
              </div>
            )}
          </div>
        </div>

        <div style={s.card}>
          {error && (
            <div style={{ ...s.alert, ...s.alertError }} data-testid="error-message" role="alert">
              ❌ {error}
            </div>
          )}
          {success && (
            <div style={{ ...s.alert, ...s.alertSuccess }} data-testid="success-message" role="status">
              {success}
            </div>
          )}

          <form onSubmit={this.handleSubmit} noValidate>
            {/* Employee Name */}
            <div style={s.formGroup}>
              <label style={s.label} htmlFor="employeeName">Employee Name</label>
              <input
                id="employeeName"
                style={{ ...s.input, ...s.inputReadOnly }}
                value={employee ? employee.name : ''}
                readOnly
                data-testid="employee-name"
                aria-label="Employee name (auto-filled)"
              />
            </div>

            {/* Date row */}
            <div style={s.row}>
              <div style={s.formGroup}>
                <label style={s.label} htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  style={s.input}
                  value={startDate}
                  onChange={this.handleChange('startDate')}
                  required
                  data-testid="start-date"
                  aria-label="Start date"
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label} htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  style={s.input}
                  value={endDate}
                  onChange={this.handleChange('endDate')}
                  required
                  data-testid="end-date"
                  aria-label="End date"
                  min={startDate}
                />
              </div>
            </div>

            {/* Reason */}
            <div style={s.formGroup}>
              <label style={s.label} htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                style={s.textarea}
                value={reason}
                onChange={this.handleChange('reason')}
                placeholder="Briefly describe the reason for your leave..."
                required
                data-testid="reason"
                aria-label="Reason for leave"
              />
            </div>

            <button
              type="submit"
              style={{
                ...s.submitBtn,
                ...(submitting || !employee ? s.submitBtnDisabled : {}),
              }}
              disabled={submitting || !employee}
              data-testid="submit-btn"
            >
              {submitting ? '⏳ Submitting…' : '🚀 Submit Leave Request'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default withRouter(observer(ApplyLeave));
