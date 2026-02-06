import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Users, 
  Mail, 
  X, 
  Trash2, 
  UserPlus,
  Crown,
  Calendar
} from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}`);
      setSelectedTeam(response.data.team);
    } catch (error) {
      console.error('Error fetching team details:', error);
      setError('Failed to fetch team details');
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await api.post('/teams', { name: newTeamName.trim() });
      setNewTeamName('');
      setShowCreateModal(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error.response?.data?.error || 'Failed to create team');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !selectedTeam) return;

    try {
      await api.post(`/teams/${selectedTeam.id}/members`, { 
        email: newMemberEmail.trim() 
      });
      setNewMemberEmail('');
      setShowAddMemberModal(false);
      fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error adding member:', error);
      setError(error.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!selectedTeam || !confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/teams/${selectedTeam.id}/members/${userId}`);
      fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const deleteTeam = async () => {
    if (!selectedTeam || !confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    try {
      await api.delete(`/teams/${selectedTeam.id}`);
      setSelectedTeam(null);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error.response?.data?.error || 'Failed to delete team');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isTeamOwner = (team) => team.owner_id === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 hover-glow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Teams</h1>
            <p className="text-slate-600">
              Manage your teams and collaborate with team members.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden hover-glow">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-900">Your Teams</h2>
            </div>
            <div className="p-6">
              {teams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No teams yet</h3>
                  <p className="text-slate-600">Create your first team to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => fetchTeamDetails(team.id)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all duration-200
                        ${selectedTeam?.id === team.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{team.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {isTeamOwner(team) ? 'Owner' : 'Member'} • {team.owner_name}
                          </p>
                        </div>
                        {isTeamOwner(team) && (
                          <Crown className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="card">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedTeam.name}</h2>
                    <p className="text-sm text-slate-500">
                      Created by {selectedTeam.owner_name} on {formatDate(selectedTeam.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isTeamOwner(selectedTeam) && (
                      <>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="btn btn-secondary"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Member
                        </button>
                        <button
                          onClick={deleteTeam}
                          className="btn btn-danger"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Team Members</h3>
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 text-sm font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                          {member.id === selectedTeam.owner_id && (
                            <Crown className="ml-2 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {isTeamOwner(selectedTeam) && member.id !== selectedTeam.owner_id && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No members yet</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {isTeamOwner(selectedTeam) ? 'Add team members to start collaborating.' : 'Waiting for members to be added.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">Select a team</h3>
                <p className="mt-1 text-sm text-slate-500">Choose a team from the list to view details and manage members.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Create New Team</h3>
            </div>
            <form onSubmit={createTeam}>
              <div className="p-6">
                <label htmlFor="teamName" className="block text-sm font-medium text-slate-700 mb-2">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="input"
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
            </div>
            <form onSubmit={addMember}>
              <div className="p-6">
                <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="memberEmail"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="input"
                  placeholder="Enter member's email"
                  required
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMemberEmail('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
