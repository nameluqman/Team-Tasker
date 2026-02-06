import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  Users, 
  CheckSquare, 
  Plus, 
  Calendar,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentTeams, setRecentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when page becomes visible (user navigates back to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Fetch tasks
      const tasksResponse = await api.get('/tasks');
      const tasks = tasksResponse.data.tasks || [];
      
      // Fetch teams
      const teamsResponse = await api.get('/teams');
      const teams = teamsResponse.data.teams || [];

      // Calculate stats
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = tasks.filter(task => task.status === 'todo').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

      setStats({
        totalTeams: teams.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks
      });

      // Get recent tasks (last 5)
      const recent = tasks
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentTasks(recent);

      // Get recent teams (last 3)
      const recentTeamsList = teams
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      setRecentTeams(recentTeamsList);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data to prevent UI crashes
      setStats({
        totalTeams: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
      });
      setRecentTasks([]);
      setRecentTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
      case 'in-progress':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200';
      case 'todo':
        return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card p-6 hover-glow bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-purple-600">
              Here's what's happening with your teams and tasks today.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-primary flex items-center w-full lg:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover-glow bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Teams</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{stats.totalTeams}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover-glow bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">Total Tasks</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{stats.totalTasks}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg">
              <CheckSquare className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover-glow bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{stats.completedTasks}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover-glow bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-amber-900 mt-2">{stats.pendingTasks}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card overflow-hidden hover-glow">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Recent Tasks</h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks yet</h3>
                <p className="text-slate-600 mb-6">Get started by creating your first task.</p>
                <button
                  onClick={() => navigate('/tasks')}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{task.team_name}</p>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        {formatDate(task.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Teams */}
        <div className="card overflow-hidden hover-glow">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Recent Teams</h2>
              <button
                onClick={() => navigate('/teams')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No teams yet</h3>
                <p className="text-slate-600 mb-6">Create your first team to start collaborating.</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/teams')}
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTeams.map((team) => (
                  <div key={team.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{team.name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {team.is_member ? 'Member' : 'Owner'} • {team.owner_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 flex items-center">
                        <Calendar className="inline w-3 h-3 mr-1" />
                        {formatDate(team.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
