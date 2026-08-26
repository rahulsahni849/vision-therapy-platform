import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiClient } from '../../lib/api';

export function PractitionerDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'patients' | 'prescribe' | 'review'>('patients');
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientAssignments, setPatientAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prescribeForm, setPrescribeForm] = useState({ activityId: '', config: '{}' });
  const [prescribeLoading, setPrescribeLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
      try {
        config = JSON.parse(prescribeForm.config);
      } catch {
        config = {};
      }

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
    try {
      const sessionsData = await apiClient.getAssignmentSessions(assignment.id);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Practitioner Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          {(['patients', 'prescribe', 'review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'prescribe' ? 'Prescribe Activity' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">My Patients</h2>
              <div className="space-y-2">
                {users.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full text-left p-3 rounded-lg ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-gray-500">{patient.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              {selectedPatient ? (
                <>
                  <h2 className="text-lg font-semibold mb-4">
                    {selectedPatient.firstName}'s Assignments
                  </h2>
                  {patientAssignments.length === 0 ? (
                    <p className="text-gray-500">No assignments yet. Go to Prescribe Activity to assign one.</p>
                  ) : (
                    <div className="space-y-3">
                      {patientAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{assignment.activity.name}</div>
                              <div className="text-sm text-gray-500">
                                Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                Sessions: {assignment.sessions?.length || 0}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab('review');
                                handleViewSessions(assignment);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800"
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
                <div className="text-center text-gray-500 py-12">
                  Select a patient to view their assignments
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescribe Tab */}
        {activeTab === 'prescribe' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Prescribe Activity</h2>
            {!selectedPatient ? (
              <p className="text-gray-500">Please select a patient from the Patients tab first.</p>
            ) : (
              <form onSubmit={handlePrescribe} className="max-w-xl space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  Prescribing for: <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity</label>
                  <select
                    required
                    value={prescribeForm.activityId}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, activityId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select an activity</option>
                    {activities.map((oa) => (
                      <option key={oa.activityId} value={oa.activityId}>
                        {oa.activity.name} ({oa.activity.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Configuration (JSON)
                  </label>
                  <textarea
                    value={prescribeForm.config}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, config: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave as {"{}"} for default settings, or customize per patient
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={prescribeLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {prescribeLoading ? 'Prescribing...' : 'Prescribe Activity'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {selectedAssignment ? `Sessions: ${selectedAssignment.activity.name}` : 'Select an assignment to review'}
            </h2>

            {!selectedAssignment ? (
              <p className="text-gray-500">Go to Patients tab and click "View Sessions" on an assignment.</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-500">No sessions completed yet.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">
                          Session - {new Date(session.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.startedAt).toLocaleTimeString()} -{' '}
                          {session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : 'In progress'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {session.metrics?.map((metric: any) => (
                        <div key={metric.key} className="p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">{metric.key}</div>
                          <div className="font-medium">{metric.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
