import React, { useState, useMemo } from 'react';
import { useAegis } from '../../context/AegisContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Clock,
  User,
  AlertCircle,
  X,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const TaskBoardView: React.FC = () => {
  const { tasks, createTask, updateTask, deleteTask, moveTaskStatus, participants } = useAegis();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form State for Create / Edit
  const [taskForm, setTaskForm] = useState<{
    id?: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assigneeId: string;
    dueDate: string;
  }>({
    title: '',
    description: '',
    priority: 'Medium',
    assigneeId: participants[0]?.id || 'p-01',
    dueDate: '',
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'Open', label: 'Open', color: 'border-t-2 border-[#8495A5]' },
    { id: 'In Progress', label: 'In Progress', color: 'border-t-2 border-[#48DDF2]' },
    { id: 'Blocked', label: 'Blocked', color: 'border-t-2 border-[#FF6464]' },
    { id: 'Completed', label: 'Completed', color: 'border-t-2 border-[#9FE870]' },
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchAssignee = t.assigneeCallsign.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'Medium',
      assigneeId: participants[0]?.id || 'p-01',
      dueDate: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (t: Task) => {
    setTaskForm({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      assigneeId: t.assigneeId,
      dueDate: t.dueDate || '',
    });
    setShowCreateModal(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const assignedPart = participants.find((p) => p.id === taskForm.assigneeId);
    const assigneeCallsign = assignedPart?.callsign || 'AEGIS-LEAD';

    if (taskForm.id) {
      // Edit mode
      await updateTask(taskForm.id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId,
        assigneeCallsign,
        dueDate: taskForm.dueDate || undefined,
      });
    } else {
      // Create mode
      await createTask({
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: 'Open',
        assigneeId: taskForm.assigneeId,
        assigneeCallsign,
        dueDate: taskForm.dueDate || undefined,
      });
    }

    setShowCreateModal(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setShowDeleteConfirm(null);
    if (selectedTask?.id === id) setSelectedTask(null);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'Critical') return 'text-[#FF6464] bg-[#FF6464]/10 border-[#FF6464]/20';
    if (p === 'High') return 'text-[#FFBF69] bg-[#FFBF69]/10 border-[#FFBF69]/20';
    if (p === 'Medium') return 'text-[#48DDF2] bg-[#48DDF2]/10 border-[#48DDF2]/20';
    return 'text-[#8495A5] bg-[#8495A5]/10 border-[#8495A5]/20';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>TEAM TO-DO BOARD</span>
            <span>·</span>
            <span>{tasks.length} ACTIVE DUTIES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-[#9FE870]" />
            Team Tasks & Assignments
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Keep your team organized. Create jobs, assign teammates, and drag or click to update task progress.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#9FE870] hover:bg-[#9FE870]/90 text-[#080D12] font-black font-display text-sm rounded-xl transition-all shadow-lg hover:shadow-[#9FE870]/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create New Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111922] border border-[#17232D] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#8495A5] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task titles, descriptions, assignees..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">All Assignees</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.callsign} ({p.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-xl bg-[#111922] border border-[#17232D] ${col.color} p-3.5 flex flex-col justify-between min-h-[500px]`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#17232D]">
                  <span className="text-xs font-bold text-[#F3F7FA] tracking-wide uppercase">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#8495A5] px-2 py-0.5 rounded bg-[#080D12] border border-[#17232D]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#8495A5] border border-dashed border-[#17232D] rounded-lg">
                      No {col.label.toLowerCase()} tasks
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="p-3.5 rounded-lg bg-[#080D12] border border-[#17232D] hover:border-[#48DDF2]/50 transition-all cursor-pointer space-y-2 group"
                      >
                        {/* Priority & ID */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#8495A5]">{t.id}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h4 className="text-xs font-bold text-[#F3F7FA] group-hover:text-[#48DDF2] transition-colors leading-snug">
                            {t.title}
                          </h4>
                          <p className="text-[11px] text-[#8495A5] line-clamp-2 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </div>

                        {/* Assignee & Footer */}
                        <div className="pt-2 border-t border-[#17232D]/70 flex items-center justify-between text-[11px] font-mono text-[#8495A5]">
                          <span className="flex items-center gap-1 text-[#48DDF2]">
                            <User className="w-3 h-3" />
                            {t.assigneeCallsign}
                          </span>

                          {/* Quick Advance Button */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1"
                          >
                            {col.id === 'Open' && (
                              <button
                                onClick={() => moveTaskStatus(t.id, 'In Progress')}
                                className="px-1.5 py-0.5 bg-[#17232D] hover:bg-[#48DDF2]/20 text-[#48DDF2] rounded text-[10px]"
                                title="Move to In Progress"
                              >
                                Start →
                              </button>
                            )}
                            {col.id === 'In Progress' && (
                              <button
                                onClick={() => moveTaskStatus(t.id, 'Completed')}
                                className="px-1.5 py-0.5 bg-[#17232D] hover:bg-[#9FE870]/20 text-[#9FE870] rounded text-[10px]"
                                title="Mark Completed"
                              >
                                Done ✓
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column quick add */}
              <button
                onClick={handleOpenCreateModal}
                className="w-full mt-3 py-2 border border-dashed border-[#17232D] hover:border-[#48DDF2]/40 rounded-lg text-xs text-[#8495A5] hover:text-[#F3F7FA] transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                Add Task
              </button>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111922] border border-[#17232D] rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#17232D]">
              <div>
                <span className="text-xs font-mono text-[#48DDF2]">{selectedTask.id}</span>
                <h3 className="text-base font-bold text-[#F3F7FA] mt-0.5">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status and Priority Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
                <span className="text-[#8495A5] text-[10px] block mb-1">STATUS</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    moveTaskStatus(selectedTask.id, e.target.value as TaskStatus);
                    setSelectedTask((prev) => prev ? { ...prev, status: e.target.value as TaskStatus } : null);
                  }}
                  className="bg-transparent text-[#9FE870] font-bold outline-none cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
                <span className="text-[#8495A5] text-[10px] block mb-1">PRIORITY</span>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => {
                    updateTask(selectedTask.id, { priority: e.target.value as TaskPriority });
                    setSelectedTask((prev) => prev ? { ...prev, priority: e.target.value as TaskPriority } : null);
                  }}
                  className="bg-transparent text-[#FFBF69] font-bold outline-none cursor-pointer"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#8495A5]">DESCRIPTION</span>
              <p className="text-xs text-[#F3F7FA] bg-[#080D12] p-3 rounded-lg border border-[#17232D] leading-relaxed">
                {selectedTask.description}
              </p>
            </div>

            {/* Assignee & Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#8495A5]">
              <div>
                <span>Assignee: </span>
                <strong className="text-[#48DDF2]">{selectedTask.assigneeCallsign}</strong>
              </div>
              <div>
                <span>Created: </span>
                <strong className="text-[#F3F7FA]">
                  {new Date(selectedTask.createdAt).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Audit History */}
            <div className="space-y-2 pt-2 border-t border-[#17232D]">
              <span className="text-xs font-semibold text-[#8495A5]">ACTIVITY HISTORY</span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedTask.history?.map((h) => (
                  <div key={h.id} className="p-2 rounded bg-[#080D12] text-[11px] font-mono space-y-0.5 border border-[#17232D]">
                    <div className="flex justify-between text-[#8495A5]">
                      <span className="text-[#48DDF2] font-semibold">{h.actor}</span>
                      <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#F3F7FA]">{h.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#17232D] flex items-center justify-between">
              <button
                onClick={() => setShowDeleteConfirm(selectedTask.id)}
                className="px-3 py-1.5 text-xs text-[#FF6464] hover:bg-[#FF6464]/10 rounded flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Task
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedTask)}
                  className="px-3 py-1.5 text-xs text-[#48DDF2] bg-[#17232D] hover:bg-[#1f2f3d] rounded flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Details
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#F3F7FA] hover:bg-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmitTask}
            className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#17232D]">
              <h4 className="text-sm font-semibold text-[#F3F7FA] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#9FE870]" />
                {taskForm.id ? 'Edit Coordination Task' : 'Create Coordination Task'}
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8495A5] block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Tactical Repeater Antenna Port Inspection"
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none"
                />
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Specific instructions or verification checkpoints..."
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8495A5] block mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
                    }
                    className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-[#F3F7FA] rounded-lg outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8495A5] block mb-1">Assignee</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, assigneeId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-[#F3F7FA] rounded-lg outline-none"
                  >
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.callsign} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17232D]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#9FE870] hover:bg-[#9FE870]/90 rounded"
              >
                {taskForm.id ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#FF6464]/40 rounded-xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-[#FF6464] flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Coordination Task?
            </h4>
            <p className="text-xs text-[#8495A5]">
              This will permanently delete this task record and its activity history from local storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(showDeleteConfirm)}
                className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#FF6464] hover:bg-[#FF6464]/90 rounded"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
