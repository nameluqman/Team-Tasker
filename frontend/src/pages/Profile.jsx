import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Save } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    teamsCreated: 0,
    tasksAssigned: 0,
    tasksCompleted: 0
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch profile data
      const profileResponse = await api.get('/users/profile');
      setProfile(profileResponse.data.user);
      
      // Fetch statistics data
      const tasksResponse = await api.get('/tasks');
      const teamsResponse = await api.get('/teams');
      
      const tasks = tasksResponse.data.tasks || [];
      const teams = teamsResponse.data.teams || [];
      
      // Calculate statistics
      const teamsCreated = teams.filter(team => team.owner_id === profileResponse.data.user.id).length;
      const tasksAssigned = tasks.filter(task => task.assigned_to === profileResponse.data.user.id).length;
      const tasksCompleted = tasks.filter(task => task.assigned_to === profileResponse.data.user.id && task.status === 'completed').length;
      
      setStats({
        teamsCreated,
        tasksAssigned,
        tasksCompleted
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/users/profile', { name: profile.name });
      setProfile(response.data.user);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900">Profile</h1>
        <p className="mt-2 text-purple-600">Manage your personal information and account settings.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="p-6 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-900">Personal Information</h2>
              <button
                onClick={() => {
                  if (editMode) {
                    setEditMode(false);
                    fetchProfile(); // Reset to original data
                  } else {
                    setEditMode(true);
                  }
                }}
                className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {editMode ? (
            <form onSubmit={updateProfile}>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={profile.name}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profile.email}
                      className="input pl-10 bg-gray-50"
                      disabled
                      placeholder="Email cannot be changed"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div>
                  <label htmlFor="created_at" className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="created_at"
                      type="text"
                      value={formatDate(profile.created_at)}
                      className="input pl-10 bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    fetchProfile();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl font-bold">
                      {profile.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-purple-900">{profile.name}</h3>
                    <p className="text-purple-600">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                    <p className="text-gray-900">{profile.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email Address</h4>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Member Since</h4>
                    <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Account Status</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Statistics */}
        <div className="card mt-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="p-6 border-b border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900">Account Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-900">{stats.teamsCreated}</div>
                <p className="mt-1 text-sm text-blue-700">Teams Created</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-900">{stats.tasksAssigned}</div>
                <p className="mt-1 text-sm text-purple-700">Tasks Assigned</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-900">{stats.tasksCompleted}</div>
                <p className="mt-1 text-sm text-green-700">Tasks Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
