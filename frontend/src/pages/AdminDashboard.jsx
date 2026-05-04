import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProjects, createProject, createTask, fetchUsers, fetchPendingUsers, verifyAdmin, reviewTask } from "../services/api";

export default function AdminDashboard() {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Task Assignment State
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [taskError, setTaskError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsData, usersData, pendingData] = await Promise.all([
        fetchProjects(),
        fetchUsers(),
        fetchPendingUsers(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
      setPendingAdmins(pendingData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAdmin(userId) {
    try {
      await verifyAdmin(userId);
      loadData();
    } catch (err) {
      console.error("Failed to verify admin:", err);
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    try {
      await createProject(projectTitle, projectDescription);
      setProjectTitle("");
      setProjectDescription("");
      setShowProjectModal(false);
      loadData();
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  }

  function toggleAssignee(userId) {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  }

  async function handleAssignTask(e) {
    e.preventDefault();
    setTaskError("");
    setTaskSuccess("");

    if (selectedAssignees.length === 0) {
      setTaskError("Please select at least one assignee.");
      return;
    }

    try {
      const dueDateTime = new Date(taskDueDate).toISOString();
      await createTask(
        parseInt(selectedProjectId),
        taskTitle,
        taskDescription,
        taskPriority,
        dueDateTime,
        selectedAssignees
      );
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskDueDate("");
      setSelectedAssignees([]);
      setSelectedProjectId("");
      setTaskSuccess("Task assigned successfully!");
      loadData();
      setTimeout(() => setTaskSuccess(""), 3000);
    } catch (err) {
      setTaskError(err.message);
    }
  }

  async function handleReviewTask(taskId, performance) {
    try {
      await reviewTask(taskId, performance);
      loadData(); // Reload to get updated stats and statuses
    } catch (err) {
      console.error("Failed to review task:", err);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const memberUsers = users.filter((u) => u.role === "MEMBER");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const allTasks = projects.flatMap(p => p.tasks);
  const totalTasks = allTasks.length;
  const tasksToDo = allTasks.filter(t => t.status === "PENDING").length;
  const tasksInProgress = allTasks.filter(t => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const tasksDone = allTasks.filter(t => t.status === "COMPLETED").length;
  const overdueTasks = allTasks.filter(t => new Date(t.due_date) < new Date() && t.status !== "COMPLETED").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-12">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Ethara AI</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
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
        {/* PENDING ADMINS SECTION */}
        {pendingAdmins.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Pending Admin Approvals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingAdmins.map(admin => (
                <div key={admin.id} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">{admin.name}</p>
                    <p className="text-xs text-gray-400">{admin.email}</p>
                  </div>
                  <button 
                    onClick={() => handleVerifyAdmin(admin.id)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DASHBOARD METRICS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{totalTasks}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">By Status</p>
            <div className="text-xs text-gray-300 space-y-0.5 mt-1.5">
              <div className="flex justify-between"><span>To Do:</span><span className="text-white">{tasksToDo}</span></div>
              <div className="flex justify-between"><span>In Progress:</span><span className="text-white">{tasksInProgress}</span></div>
              <div className="flex justify-between"><span>Done:</span><span className="text-white">{tasksDone}</span></div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Active Members</p>
            <p className="text-2xl font-bold text-blue-400">{memberUsers.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-red-400/80 font-medium uppercase tracking-wider mb-1">Overdue Tasks</p>
            <p className="text-2xl font-bold text-red-400">{overdueTasks}</p>
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Projects</h2>
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              + New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <p className="text-gray-500">No projects yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{project.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ASSIGN TASK SECTION */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Assign a Task</h2>
          <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50">
            {taskError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {taskError}
              </div>
            )}
            {taskSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {taskSuccess}
              </div>
            )}

            <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-300">Project</label>
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-300">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="e.g. Label 500 images"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                    placeholder="Optional details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-300">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-300">Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Select Assignees */}
              <div className="flex flex-col h-full">
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Assign To (Multiple allowed)</label>
                <div className="flex-1 bg-gray-700/30 border border-gray-600/50 rounded-lg p-3 space-y-2 max-h-[220px] overflow-y-auto">
                  {memberUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No verified members available</p>
                  ) : (
                    memberUsers.map(user => (
                      <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedAssignees.includes(user.id)}
                          onChange={() => toggleAssignee(user.id)}
                          className="w-4 h-4 rounded text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500/50"
                        />
                        <span className="text-sm text-gray-300">{user.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ALL TASKS / REVIEW TASKS SECTION */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Task Verification & Overview</h2>
          {projects.every((p) => p.tasks.length === 0) ? (
            <div className="text-center py-12 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <p className="text-gray-500">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-700/50">
              <table className="w-full text-left">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Task</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Assignees</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {projects.flatMap((project) =>
                    project.tasks.map((task) => {
                      const assigneeNames = task.assignees.map(a => a.name).join(", ");
                      const isOverdue = new Date(task.due_date) < new Date() && task.status !== "COMPLETED";

                      return (
                        <tr key={task.id} className="bg-gray-800/30 hover:bg-gray-800/60 transition-colors">
                          <td className="px-5 py-3">
                            <div className="text-sm text-white">{task.title}</div>
                            {isOverdue && <div className="text-xs text-red-400 mt-1">⚠️ Overdue</div>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' : task.priority === 'Low' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-400">{project.title}</td>
                          <td className="px-5 py-3 text-sm text-gray-400 max-w-[200px] truncate" title={assigneeNames}>
                            {assigneeNames || "Unassigned"}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-5 py-3">
                            {task.status === "IN_REVIEW" ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleReviewTask(task.id, "perfect")} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 cursor-pointer" title="Perfect">Perfect</button>
                                <button onClick={() => handleReviewTask(task.id, "delayed")} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/40 cursor-pointer" title="Delayed">Delayed</button>
                                <button onClick={() => handleReviewTask(task.id, "underperforming")} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 cursor-pointer" title="Underperforming">Underperf.</button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TEAM PERFORMANCE METRICS */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Team Performance Tracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {memberUsers.map(user => (
              <div key={user.id} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <h3 className="text-sm font-semibold text-white mb-3">{user.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Perfect:</span>
                    <span className="font-medium text-gray-300">{user.perfect_tasks}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-400">Delayed:</span>
                    <span className="font-medium text-gray-300">{user.delayed_tasks}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Underperforming:</span>
                    <span className="font-medium text-gray-300">{user.underperforming_tasks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-gray-800 border border-gray-700/50 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Title</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Description</label>
                <textarea
                  required
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    IN_REVIEW: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status] || styles.PENDING}`}>
      {status.replace("_", " ")}
    </span>
  );
}
