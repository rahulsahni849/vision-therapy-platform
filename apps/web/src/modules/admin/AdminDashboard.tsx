import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { SidebarLayout } from '../../components/SidebarLayout';
import { ActivityPlayer } from '../../components/ActivityPlayer';
import { SessionResultsModal } from '../../components/SessionResultsModal';

const sidebarItems = [
  { key: 'activities', label: 'Activities', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { key: 'reporting', label: 'Reporting', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('activities');
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reporting, setReporting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', role: 'PRACTITIONER' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [testingActivity, setTestingActivity] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [activitiesData, usersData, reportingData] = await Promise.all([
        apiClient.getOrgActivities(),
        apiClient.getOrgUsers(),
        apiClient.getOrgReporting(),
      ]);
      setActivities(activitiesData);
      setUsers(usersData);
      setReporting(reportingData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivity = async (activityId: string, currentEnabled: boolean) => {
    try {
      await apiClient.toggleActivity(activityId, !currentEnabled);
      setActivities(activities.map(a =>
        a.activityId === activityId ? { ...a, isEnabled: !currentEnabled } : a
      ));
    } catch (err) {
      console.error('Failed to toggle activity:', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await apiClient.inviteUser(inviteForm);
      setInviteModal(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'PRACTITIONER' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  // Activity Player
  if (testingActivity && !testResult) {
    return (
      <ActivityPlayer
        activityKey={testingActivity.key}
        onComplete={(result) => setTestResult(result)}
        onClose={() => setTestingActivity(null)}
      />
    );
  }

  // Session Results
  if (testResult && testingActivity) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <SessionResultsModal
          activityName={testingActivity.name}
          result={testResult}
          saved={false}
          onClose={() => { setTestingActivity(null); setTestResult(null); }}
          onPlayAgain={() => setTestResult(null)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemSelect={setActiveTab}
      title="Admin Dashboard"
      subtitle="Organization Admin"
      gradient="from-brand-500 to-brand-700"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      }
    >
      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Activity Management</h2>
            <p className="text-[var(--text-secondary)] mt-1">Enable, disable, or test activities for your organization</p>
          </div>

          <div className="grid gap-4">
            {activities.map((orgActivity) => (
              <div
                key={orgActivity.activityId}
                className="glass-card p-5 flex items-center justify-between hover:border-brand-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    orgActivity.isEnabled
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
                  }`}>
                    <svg className={`w-6 h-6 ${orgActivity.isEnabled ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{orgActivity.activity.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {orgActivity.activity.category} <span className="text-[var(--text-tertiary)]">• v{orgActivity.activity.version}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTestingActivity(orgActivity.activity)}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-all"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleToggleActivity(orgActivity.activityId, orgActivity.isEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                      orgActivity.isEnabled ? 'bg-emerald-500' : 'bg-[var(--border-secondary)]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                      orgActivity.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h2>
              <p className="text-[var(--text-secondary)] mt-1">Manage your organization's team members</p>
            </div>
            <button onClick={() => setInviteModal(true)} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite User
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="min-w-full divide-y divide-[var(--border-primary)]">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  {['Name', 'Email', 'Role', 'Status'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-brand' :
                        u.role === 'PRACTITIONER' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {u.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reporting Tab */}
      {activeTab === 'reporting' && reporting && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Organization Overview</h2>
            <p className="text-[var(--text-secondary)] mt-1">View your organization's analytics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Patients', value: reporting.totalPatients, color: 'blue' },
              { label: 'Practitioners', value: reporting.totalPractitioners, color: 'purple' },
              { label: 'Assignments', value: reporting.totalAssignments, color: 'amber' },
              { label: 'Sessions', value: reporting.totalSessions, color: 'emerald' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Activity Usage</h3>
            <div className="space-y-3">
              {reporting.activityUsage.map((activity: any) => (
                <div key={activity.key} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{activity.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{activity.category}</p>
                    </div>
                  </div>
                  <span className="badge badge-brand">{activity.assignmentCount} assignments</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Invite User</h3>
              <button onClick={() => setInviteModal(false)} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="input-field"
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="input-field"
                >
                  <option value="PRACTITIONER">Practitioner</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setInviteModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={inviteLoading} className="flex-1 btn-primary">
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
