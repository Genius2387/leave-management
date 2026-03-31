import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'mobx-react';

import AppContext from './context/AppContext';
import leaveStore from './store/leaveStore';
import leaveApi from './api/leaveApi';

import Navbar from './components/Navbar';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import TeamLeaves from './pages/TeamLeaves';
import Dashboard from './pages/Dashboard';

const s = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
  },
  main: {
    padding: '24px 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '12px',
    color: '#6B7280',
    fontSize: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#4F46E5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

class App extends Component {
  state = {
    initialising: true,
    initError: null,
  };

  async componentDidMount() {
    try {
      // Bootstrap: load employees + all leaves into the MobX store on startup
      const [employees, leaves] = await Promise.all([
        leaveApi.getEmployees(),
        leaveApi.getLeaves(),
      ]);
      leaveStore.setEmployees(employees);
      leaveStore.setLeaves(leaves);
    } catch (err) {
      console.warn('Initial data load failed – is the JSON server running?', err);
      // App is still usable; individual pages show their own error states
    } finally {
      this.setState({ initialising: false });
    }
  }

  render() {
    const { initialising } = this.state;

    if (initialising) {
      return (
        <div style={s.loadingOverlay}>
          {/* Simple CSS spinner without external libs */}
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={s.spinner} />
          <span>Starting LeaveFlow…</span>
        </div>
      );
    }

    return (
      // MobX Provider (for legacy inject HOC compatibility if needed)
      <Provider leaveStore={leaveStore}>
        {/* React Context Provider – used by all class components via contextType */}
        <AppContext.Provider value={leaveStore}>
          <Router>
            <div style={s.appWrapper}>
              <Navbar />

              <main style={s.main}>
                <Routes>
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/apply-leave" replace />} />

                  {/* Employee views */}
                  <Route path="/apply-leave" element={<ApplyLeave />} />
                  <Route path="/my-leaves" element={<MyLeaves />} />

                  {/* Manager view */}
                  <Route path="/team-leaves" element={<TeamLeaves />} />

                  {/* Admin view */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/apply-leave" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AppContext.Provider>
      </Provider>
    );
  }
}

export default App;
