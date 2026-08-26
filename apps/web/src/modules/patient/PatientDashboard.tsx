import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { SidebarLayout } from '../../components/SidebarLayout';
import { ActivityPlayer } from '../../components/ActivityPlayer';
import { SessionResultsModal } from '../../components/SessionResultsModal';

const sidebarItems = [
  { key: 'activities', label: 'My Activities', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { key: 'history', label: 'Session History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('activities');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadAssignments(); }, []);

  const loadAssignments = async () => {
    try {
      const data = await apiClient.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartActivity = (assignment: any) => {
    setActiveAssignment(assignment);
    setSessionResult(null);
    setSaved(false);
  };

  const handleActivityComplete = async (result: any) => {
    setSessionResult(result);
    try {
      await apiClient.createSession({
        assignmentId: activeAssignment.id,
        startedAt: new Date(Date.now() - 60000).toISOString(),
        endedAt: new Date().toISOString(),
        rawResult: result,
      });
      setSaved(true);
      loadAssignments();
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const handleCloseResults = () => {
    setActiveAssignment(null);
    setSessionResult(null);
    setSaved(false);
  };

  // Activity is playing
  if (activeAssignment && !sessionResult) {
    return (
      <ActivityPlayer
        activityKey={activeAssignment.activity.key}
        config={activeAssignment.config}
        onComplete={handleActivityComplete}
        onClose={handleCloseResults}
      />
    );
  }

  // Show results modal
  if (sessionResult && activeAssignment) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]">
        <SessionResultsModal
          activityName={activeAssignment.activity.name}
          result={sessionResult}
          saved={saved}
          onClose={handleCloseResults}
          onPlayAgain={() => { setSessionResult(null); setSaved(false); }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemSelect={setActiveTab}
      title="My Activities"
      subtitle="Patient"
      gradient="from-brand-500 to-brand-700"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      }
    >
      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="animate-fade-in">
          {assignments.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Activities Yet</h2>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                Your practitioner will assign activities for you to practice. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your Activities</h2>
                <p className="text-[var(--text-secondary)]">Click on an activity to start exercising</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignments.map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className="glass-card p-6 hover:scale-[1.02] transition-all duration-300 animate-fade-in cursor-pointer group"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleStartActivity(assignment)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="badge badge-brand">
                        {assignment.activity.category}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {assignment.sessions?.length || 0} completed
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-brand-500 transition-colors">
                      {assignment.activity.name}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Assigned by {assignment.practitioner?.firstName} {assignment.practitioner?.lastName}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Last session: {assignment.sessions?.[0]
                          ? new Date(assignment.sessions[0].createdAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all duration-200">
                        <svg className="w-5 h-5 text-brand-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Session History</h2>
            <p className="text-[var(--text-secondary)]">View your past activity sessions</p>
          </div>

          {assignments.length === 0 || assignments.every(a => !a.sessions?.length) ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Sessions Yet</h2>
              <p className="text-[var(--text-secondary)]">Complete some activities to see your history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments
                .filter(a => a.sessions?.length > 0)
                .map(assignment => (
                  <div key={assignment.id} className="glass-card p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{assignment.activity.name}</h3>
                    <div className="space-y-3">
                      {assignment.sessions.map((session: any) => (
                        <div key={session.id} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString()}
                              </p>
                              <p className="text-sm text-[var(--text-tertiary)]">
                                {session.endedAt ? `Duration: ${Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)}s` : 'In progress'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {session.metrics?.map((metric: any) => (
                                <div key={metric.key} className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
                                  <p className="text-xs text-[var(--text-tertiary)]">{metric.key}</p>
                                  <p className="text-sm font-bold text-[var(--text-primary)]">{metric.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
