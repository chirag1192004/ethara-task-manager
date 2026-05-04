import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyTasks, fetchMyProfile, updateTaskStatus } from "../services/api";

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "IN_REVIEW"]; // Members cannot select COMPLETED

const STATUS_STYLES = {
  PENDING: {
    card: "border-yellow-500/30 bg-yellow-500/5",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dot: "bg-yellow-400",
  },
  IN_PROGRESS: {
    card: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
  IN_REVIEW: {
    card: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dot: "bg-purple-400",
  },
  COMPLETED: {
    card: "border-green-500/30 bg-green-500/5",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    dot: "bg-green-400",
  },
};

export default function MemberDashboard() {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksData, profileData] = await Promise.all([
        fetchMyTasks(),
        fetchMyProfile(),
      ]);
      setTasks(tasksData);
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const updated = await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.message); // Show error if validation fails
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-12">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Ethara AI</h1>
            <p className="text-xs text-gray-500">Member Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome, {userName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* PROFILE METRICS */}
        {profile && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">My Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Perfect Tasks" count={profile.perfect_tasks} color="text-green-400" />
              <StatCard label="Delayed Tasks" count={profile.delayed_tasks} color="text-yellow-400" />
              <StatCard label="Underperforming" count={profile.underperforming_tasks} color="text-red-400" />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">My Tasks</h2>
          {tasks.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <p className="text-gray-500 text-lg">No tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <TaskColumn title="Pending" tasks={pendingTasks} onStatusChange={handleStatusChange} />
              <TaskColumn title="In Progress" tasks={inProgressTasks} onStatusChange={handleStatusChange} />
              <TaskColumn title="In Review" tasks={inReviewTasks} onStatusChange={handleStatusChange} />
              <TaskColumn title="Completed" tasks={completedTasks} onStatusChange={handleStatusChange} readOnly />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700/50 flex flex-col items-center justify-center">
      <p className="text-3xl font-bold mt-1 mb-2">{count}</p>
      <p className={`text-sm font-medium ${color}`}>{label}</p>
    </div>
  );
}

function TaskColumn({ title, tasks, onStatusChange, readOnly = false }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        {title}
        <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, readOnly }) {
  const style = STATUS_STYLES[task.status] || STATUS_STYLES.PENDING;
  
  // Calculate if task is overdue
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== "COMPLETED";

  return (
    <div className={`p-4 rounded-xl border ${style.card} transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white">{task.title}</h4>
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
      </div>

      <div className="mb-3 space-y-1">
        <p className="text-xs text-gray-400 flex items-center justify-between">
          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
          {isOverdue && <span className="text-red-400 font-bold">⚠️ Overdue</span>}
        </p>
        <p className="text-xs text-gray-500">
          Assignees: {task.assignees.length}
        </p>
      </div>

      {readOnly ? (
        <div className="w-full px-3 py-1.5 rounded-lg bg-gray-800/80 border border-green-500/30 text-green-400 text-xs text-center font-medium">
          Verified & Completed
        </div>
      ) : (
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-600/50 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace("_", " ")}
            </option>
          ))}
          {/* Include current status if it's not in the options (e.g. COMPLETED somehow) */}
          {!STATUS_OPTIONS.includes(task.status) && (
            <option value={task.status}>{task.status.replace("_", " ")}</option>
          )}
        </select>
      )}
    </div>
  );
}
