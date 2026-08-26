import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { SidebarLayout } from '../../components/SidebarLayout';
import { ActivityPlayer } from '../../components/ActivityPlayer';
import { SessionResultsModal } from '../../components/SessionResultsModal';

const sidebarItems = [
  { key: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'prescribe', label: 'Prescribe', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { key: 'review', label: 'Review Sessions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
];

export function PractitionerDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientAssignments, setPatientAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prescribeForm, setPrescribeForm] = useState({ activityId: '', config: '{}' });
  const [prescribeLoading, setPrescribeLoading] = useState(false);
  const [testingActivity, setTestingActivity] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersData, activitiesData] = await Promise.all([
        apiClient.getOrgUsers(),
        apiClient.getOrgActivities(),
      ]);
      setUsers(usersData.filter((u: any) => u.role === 'PATIENT'));
      setActivities(activitiesData.filter((a: any) => a.isEnabled));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    try {
      const assignments = await apiClient.getPatientAssignments(patient.id);
      setPatientAssignments(assignments);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setPrescribeLoading(true);
    try {
      let config = {};
      try { config = JSON.parse(prescribeForm.config); } catch { config = {}; }
      await apiClient.createAssignment({
        patientId: selectedPatient.id,
        activityId: prescribeForm.activityId,
        config,
      });
      setPrescribeForm({ activityId: '', config: '{}' });
      handleSelectPatient(selectedPatient);
    } catch (err: any) {
      alert(err.message || 'Failed to prescribe activity');
    } finally {
      setPrescribeLoading(false);
    }
  };

  const handleViewSessions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setActiveTab('review');
    try {
      const sessionsData = await apiClient.getAssignmentSessions(assignment.id);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load sessions:', err);
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
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
      title="Practitioner Dashboard"
      subtitle="Healthcare Provider"
      gradient="from-emerald-500 to-emerald-700"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
    >
      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">My Patients</h2>
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-4">No patients found</p>
              ) : (
                users.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      selectedPatient?.id === patient.id
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                        selectedPatient?.id === patient.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'
                      }`}>
                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{patient.firstName} {patient.lastName}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{patient.email}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6">
            {selectedPatient ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                    {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      {selectedPatient.firstName}'s Assignments
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">{selectedPatient.email}</p>
                  </div>
                </div>

                {patientAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-[var(--text-secondary)]">No assignments yet</p>
                    <p className="text-sm text-[var(--text-tertiary)]">Go to Prescribe to assign an activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-brand-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{assignment.activity.name}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                Assigned: {new Date(assignment.createdAt).toLocaleDateString()} • {assignment.sessions?.length || 0} sessions
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewSessions(assignment)}
                            className="btn-ghost text-sm text-brand-500 hover:text-brand-600"
                          >
                            View Sessions
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)]">Select a patient to view their assignments</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prescribe Tab */}
      {activeTab === 'prescribe' && (
        <div className="glass-card p-6 max-w-2xl animate-fade-in">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Prescribe Activity</h2>

          {!selectedPatient ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-2">No patient selected</p>
              <p className="text-sm text-[var(--text-tertiary)]">Please select a patient from the Patients tab first</p>
            </div>
          ) : (
            <form onSubmit={handlePrescribe} className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-semibold">
                  {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">Prescribing for</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Activity</label>
                <div className="flex gap-2">
                  <select
                    required
                    value={prescribeForm.activityId}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, activityId: e.target.value })}
                    className="input-field flex-1"
                  >
                    <option value="">Select an activity</option>
                    {activities.map((oa) => (
                      <option key={oa.activityId} value={oa.activityId}>
                        {oa.activity.name} ({oa.activity.category})
                      </option>
                    ))}
                  </select>
                  {prescribeForm.activityId && (
                    <button
                      type="button"
                      onClick={() => {
                        const act = activities.find(a => a.activityId === prescribeForm.activityId);
                        if (act) setTestingActivity(act.activity);
                      }}
                      className="px-4 py-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-all text-sm font-medium"
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Configuration (JSON)
                </label>
                <textarea
                  value={prescribeForm.config}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, config: e.target.value })}
                  rows={4}
                  className="input-field font-mono text-sm"
                  placeholder='{"difficulty": "medium"}'
                />
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Leave as {"{}"} for default settings, or customize per patient
                </p>
              </div>

              <button
                type="submit"
                disabled={prescribeLoading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {prescribeLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Prescribing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Prescribe Activity
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Review Tab */}
      {activeTab === 'review' && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
            {selectedAssignment ? `Sessions: ${selectedAssignment.activity.name}` : 'Session Review'}
          </h2>

          {!selectedAssignment ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)]">Select a patient and click "View Sessions" on an assignment</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)]">No sessions completed yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        Session - {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {new Date(session.startedAt).toLocaleTimeString()} -{' '}
                        {session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : 'In progress'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {session.metrics?.map((metric: any) => (
                      <div key={metric.key} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{metric.key}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
