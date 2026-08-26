import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiClient } from '../../lib/api';

export function PatientDashboard() {
  const { user, logout } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeActivity, setActiveActivity] = useState<any>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

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
    setActiveActivity(assignment);
  };

  const handleComplete = async (result: any) => {
    if (!activeActivity) return;

    try {
      await apiClient.createSession({
        assignmentId: activeActivity.id,
        startedAt: new Date(Date.now() - 60000).toISOString(),
        endedAt: new Date().toISOString(),
        rawResult: result,
      });

      setActiveActivity(null);
      loadAssignments();
    } catch (err) {
      console.error('Failed to save session:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeActivity ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{activeActivity.activity.name}</h2>
              <button
                onClick={() => setActiveActivity(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to activities
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">
                Activity: {activeActivity.activity.name}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Category: {activeActivity.activity.category}
              </p>
              <button
                onClick={() => handleComplete({
                  targets: [
                    { x: 100, y: 100, hit: true, reactionTime: 250 },
                    { x: 200, y: 150, hit: true, reactionTime: 300 },
                    { x: 300, y: 200, hit: false, reactionTime: 0 },
                  ],
                  totalTargets: 3,
                  completedTargets: 3,
                })}
                className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
              >
                Complete Activity (Demo)
              </button>
            </div>
          </div>
        ) : (
          <>
            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Activities Assigned</h2>
                <p className="text-gray-500">
                  Your practitioner will assign activities for you to practice.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {assignment.activity.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{assignment.activity.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Assigned by {assignment.practitioner?.firstName} {assignment.practitioner?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {assignment.sessions?.length || 0} sessions completed
                    </p>
                    <button
                      onClick={() => handleStartActivity(assignment)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Start Activity
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
