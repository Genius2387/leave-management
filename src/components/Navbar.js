import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { observer } from 'mobx-react';
import AppContext from '../context/AppContext';
import withRouter from '../utils/withRouter';

const ROLE_NAV = {
  employee: [
    { to: '/apply-leave', label: '✏️ Apply Leave', testId: 'nav-apply' },
    { to: '/my-leaves', label: '📋 My Leaves', testId: 'nav-my-leaves' },
  ],
  manager: [
    { to: '/team-leaves', label: '👥 Team Leaves', testId: 'nav-team' },
  ],
  admin: [
    { to: '/dashboard', label: '📊 Dashboard', testId: 'nav-dashboard' },
  ],
};

const ROLE_DEFAULT_ROUTE = {
  employee: '/apply-leave',
  manager: '/team-leaves',
  admin: '/dashboard',
};

const s = {
  nav: {
    backgroundColor: '#4F46E5',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    gap: '8px',
    minHeight: '60px',
  },
  brand: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '20px',
    letterSpacing: '-0.5px',
    padding: '12px 0',
    userSelect: 'none',
  },
  links: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  link: {
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.15s, color 0.15s',
  },
  activeLink: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    flexWrap: 'wrap',
  },
  balancePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '999px',
    padding: '4px 14px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  balanceLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    border: '1px solid rgba(239, 68, 68, 0.6)',
  },
  roleSwitcher: {
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
  },
  employeeName: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
};

class Navbar extends Component {
  static contextType = AppContext;

  handleRoleChange = (e) => {
    const newRole = e.target.value;
    this.context.setRole(newRole);
    // Navigate to the default page for the newly selected role
    this.props.navigate(ROLE_DEFAULT_ROUTE[newRole] || '/');
  };

  getLinkStyle = (isActive) => ({
    ...s.link,
    ...(isActive ? s.activeLink : {}),
  });

  render() {
    const store = this.context;
    const { currentRole, currentEmployee } = store;
    const navItems = ROLE_NAV[currentRole] || [];
    const balance = currentEmployee ? currentEmployee.leaveBalance : 0;
    const isLowBalance = balance <= 5;

    return (
      <nav style={s.nav} role="navigation" aria-label="Main navigation">
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={s.brand}>🏢 LeaveFlow</span>
        </Link>

        {/* Role-specific nav links */}
        <div style={s.links}>
          {navItems.map(({ to, label, testId }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={testId}
              style={({ isActive }) => this.getLinkStyle(isActive)}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right section: balance + role switcher */}
        <div style={s.rightSection}>
          {currentEmployee && (
            <span style={s.employeeName}>
              {currentEmployee.name}
            </span>
          )}

          {currentRole === 'employee' && currentEmployee && (
            <span
              style={{
                ...s.balancePill,
                ...(isLowBalance ? s.balanceLow : {}),
              }}
              data-testid="leave-balance"
              title="Remaining leave balance for the year"
            >
              🗓 {balance} day{balance !== 1 ? 's' : ''} left
            </span>
          )}

          <select
            style={s.roleSwitcher}
            value={currentRole}
            onChange={this.handleRoleChange}
            data-testid="role-switcher"
            aria-label="Switch role"
          >
            <option value="employee">👤 Employee</option>
            <option value="manager">👔 Manager</option>
            <option value="admin">🔧 Admin</option>
          </select>
        </div>
      </nav>
    );
  }
}

export default withRouter(observer(Navbar));
