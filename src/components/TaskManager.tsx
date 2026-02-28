import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  tasks: string[];
}

export default function TaskManager() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeView, setActiveView] = useState<'board' | 'list' | 'milestones'>('board');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    loadTasks();
    loadMilestones();
  }, []);

  const loadTasks = () => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      // Sample tasks
      const sampleTasks: Task[] = [
        {
          id: '1',
          title: 'Setup project structure',
          description: 'Create initial folder structure and configuration files',
          status: 'done',
          priority: 'high',
          assignee: 'John Doe',
          dueDate: '2024-01-20',
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000,
          tags: ['setup', 'config']
        },
        {
          id: '2',
          title: 'Implement user authentication',
          description: 'Add login/logout functionality with JWT tokens',
          status: 'in-progress',
          priority: 'high',
          assignee: 'Jane Smith',
          dueDate: '2024-01-25',
          createdAt: Date.now() - 43200000,
          updatedAt: Date.now() - 1800000,
          tags: ['auth', 'security']
        },
        {
          id: '3',
          title: 'Design database schema',
          description: 'Create ERD and define table structures',
          status: 'todo',
          priority: 'medium',
          dueDate: '2024-01-22',
          createdAt: Date.now() - 21600000,
          updatedAt: Date.now() - 21600000,
          tags: ['database', 'design']
        }
      ];
      setTasks(sampleTasks);
    }
  };

  const loadMilestones = () => {
    const saved = localStorage.getItem('milestones');
    if (saved) {
      setMilestones(JSON.parse(saved));
    } else {
      // Sample milestones
      const sampleMilestones: Milestone[] = [
        {
          id: '1',
          title: 'MVP Release',
          description: 'Basic functionality for initial release',
          dueDate: '2024-02-15',
          progress: 65,
          tasks: ['1', '2']
        },
        {
          id: '2',
          title: 'Beta Testing',
          description: 'Feature complete version for testing',
          dueDate: '2024-03-01',
          progress: 20,
          tasks: ['3']
        }
      ];
      setMilestones(sampleMilestones);
    }
  };

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  // const saveMilestones = (newMilestones: Milestone[]) => {
  //   setMilestones(newMilestones);
  //   localStorage.setItem('milestones', JSON.stringify(newMilestones));
  // };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveTasks([...tasks, newTask]);
    setShowAddTask(false);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(task =>
      task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
    );
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(task => task.id !== id));
  };

  // const addMilestone = (milestoneData: Omit<Milestone, 'id' | 'progress' | 'tasks'>) => {
  //   const newMilestone: Milestone = {
  //     ...milestoneData,
  //     id: Date.now().toString(),
  //     progress: 0,
  //     tasks: []
  //   };
  //   saveMilestones([...milestones, newMilestone]);
  //   setShowAddMilestone(false);
  // };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)]/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <div className="flex gap-1">
          <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
          <button
            onClick={() => deleteTask(task.id)}
            className="text-red-500 hover:bg-red-500/20 rounded p-0.5 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      
      <p className="text-xs text-[var(--color-textSecondary)] mb-2 line-clamp-2">
        {task.description}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-1">
          {task.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded">
              {tag}
            </span>
          ))}
        </div>
        {task.dueDate && (
          <span className="text-[var(--color-textSecondary)]">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      
      {task.assignee && (
        <div className="mt-2 text-xs text-[var(--color-textSecondary)]">
          👤 {task.assignee}
        </div>
      )}
      
      <select
        value={task.status}
        onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
        className="mt-2 w-full px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-xs"
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );

  const AddTaskForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      status: 'todo' as const,
      priority: 'medium' as const,
      assignee: '',
      dueDate: '',
      tags: [] as string[]
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                placeholder="Task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm resize-none"
                rows={3}
                placeholder="Task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                placeholder="Assigned to"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowAddTask(false)}
              className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => addTask(formData)}
              className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">✅ {t('activity.tasks')}</h2>
        
        {/* View Tabs */}
        <div className="flex gap-1 mb-3">
          {(['board', 'list', 'milestones'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                activeView === view
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'hover:bg-[var(--color-hover)]'
              }`}
            >
              {view === 'board' ? t('tasks.board') : 
               view === 'list' ? t('tasks.list') : 
               t('tasks.milestones')}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-xs"
          >
            <option value="all">{t('tasks.allStatus')}</option>
            <option value="todo">{t('tasks.todo')}</option>
            <option value="in-progress">{t('tasks.inProgress')}</option>
            <option value="done">{t('tasks.done')}</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-xs"
          >
            <option value="all">{t('tasks.allPriority')}</option>
            <option value="high">{t('tasks.high')}</option>
            <option value="medium">{t('tasks.medium')}</option>
            <option value="low">{t('tasks.low')}</option>
          </select>
        </div>

        <button
          onClick={() => activeView === 'milestones' ? setShowAddMilestone(true) : setShowAddTask(true)}
          className="w-full px-3 py-2 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity"
        >
          ➕ {activeView === 'milestones' ? t('tasks.addMilestone') : t('tasks.addTask')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeView === 'board' && (
          <div className="grid grid-cols-3 gap-4 h-full">
            {(['todo', 'in-progress', 'done'] as const).map(status => (
              <div key={status} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></span>
                  <h3 className="font-semibold capitalize">
                    {status.replace('-', ' ')}
                  </h3>
                  <span className="text-xs bg-[var(--color-background)] px-2 py-0.5 rounded">
                    {getFilteredTasks().filter(t => t.status === status).length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {getFilteredTasks()
                    .filter(task => task.status === status)
                    .map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'list' && (
          <div className="space-y-2">
            {getFilteredTasks().map(task => (
              <div key={task.id} className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></span>
                    <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex gap-1">
                      {task.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--color-textSecondary)]">
                    {task.assignee && <span>👤 {task.assignee}</span>}
                    {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:bg-red-500/20 rounded p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-textSecondary)] mt-2 ml-6">
                  {task.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeView === 'milestones' && (
          <div className="space-y-4">
            {milestones.map(milestone => (
              <div key={milestone.id} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{milestone.title}</h3>
                  <span className="text-sm text-[var(--color-textSecondary)]">
                    📅 {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-textSecondary)] mb-3">
                  {milestone.description}
                </p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{milestone.progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] rounded-full h-2">
                    <div
                      className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-[var(--color-textSecondary)]">
                  {milestone.tasks.length} tasks assigned
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddTask && <AddTaskForm />}
      {showAddMilestone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Milestone</h3>
            <p className="text-sm text-[var(--color-textSecondary)]">
              Milestone creation form would go here...
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddMilestone(false)}
                className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
