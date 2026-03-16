import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { communitiesAPI, membershipsAPI } from '../utils/api';
import { 
  Plus, 
  Users, 
  MapPin, 
  Globe, 
  Lock, 
  CheckCircle, 
  Clock, 
  Settings, 
  Crown,
  Building,
  Shield,
  Star,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  CheckSquare,
  XSquare,
  AlertCircle,
  UserCheck,
  UserX,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

function Communities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  });

  // Fix: Proper manager detection - check both user_type and is_manager property
  const isManager = user?.user_type === 'manager' || user?.is_manager === true;
  const isAdmin = user?.is_superuser;

  // Helper: Check if user is a member of the community
  const isUserMember = (community) => {
    if (!user || !community) return false;
    // If user is admin (manager of this community), always true
    if (community.admin?.id === user.id) return true;
    // If user is in approved members (if available)
    if (Array.isArray(community.members)) {
      return community.members.some(m => m.id === user.id && m.status === 'approved');
    }
    // Fallback: if member_count > 0, assume user is member (for demo)
    return false;
  };

  // Helper: Get user's membership status for a community
  const getUserMembershipStatus = (community) => {
    if (!user || !community) return null;
    // Check if user is admin
    if (community.admin?.id === user.id) return 'admin';
    // Check membership status from userMemberships
    const membership = userMemberships.find(m => m.community === community.id);
    return membership?.status || null;
  };

  // Helper: Check if user can apply to a community
  const canApplyToCommunity = (community) => {
    if (!community || community.community_type !== 'private') return false;
    if (isUserMember(community)) return false;
    
    const membershipStatus = getUserMembershipStatus(community);
    return membershipStatus !== 'pending' && membershipStatus !== 'approved';
  };

  // Fetch communities with proper error handling
  const { 
    data: communities = [], 
    isLoading,
    error: communitiesError 
  } = useQuery('communities', communitiesAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Communities API error:', error),
    refetchOnWindowFocus: false,
  });

  // Fetch manager stats if user is manager
  const { data: managerStats = null } = useQuery(
    'managerStats', 
    communitiesAPI.getManagerStats,
    {
      enabled: isManager,
      retry: 1,
      onError: (error) => console.log('Manager stats API error:', error),
      refetchOnWindowFocus: false,
    }
  );

  // Fetch user memberships to track application status
  const { data: userMemberships = [] } = useQuery(
    'userMemberships',
    membershipsAPI.getMyMemberships,
    {
      retry: 1,
      onError: (error) => console.log('User memberships API error:', error),
      refetchOnWindowFocus: false,
    }
  );

  // Ensure communities is always an array
  const communityArray = Array.isArray(communities?.results) ? communities.results : Array.isArray(communities) ? communities : [];

  // Filter communities based on search and filters
  const filteredCommunities = communityArray.filter(community => {
    const matchesSearch = !filters.search || 
      community.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      community.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      community.location?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = !filters.type || community.community_type === filters.type;
    return matchesSearch && matchesType;
  });

  // Debug: Print API data and filtered communities
  console.log('Raw API data:', communities);
  console.log('Decoded communityArray:', communityArray);
  console.log('Filtered communities:', filteredCommunities);

  // Mutations
  const joinMutation = useMutation(communitiesAPI.join, {
    onSuccess: () => {
      queryClient.invalidateQueries('communities');
      toast.success('Successfully joined the community!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to join community');
    },
  });

  const applyMutation = useMutation(communitiesAPI.apply, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('communities');
      queryClient.invalidateQueries('myCommunities');
      queryClient.invalidateQueries('userMemberships');
      toast.success(data?.message || 'Application submitted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to apply to community';
      toast.error(errorMessage);
      console.error('Apply error:', error.response?.data);
    },
  });

  const deleteMutation = useMutation(communitiesAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('communities');
      toast.success('Community deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete community');
    },
  });

  const approveMutation = useMutation(
    (data) => membershipsAPI.approve(data.membershipId, { status: 'approved' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('communities');
        toast.success('Member approved successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to approve member');
      },
    }
  );

  const rejectMutation = useMutation(
    (membershipId) => membershipsAPI.reject(membershipId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('communities');
        toast.success('Application rejected successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to reject application');
      },
    }
  );

  const removeMemberMutation = useMutation(
    (membershipId) => membershipsAPI.removeMember(membershipId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('communities');
        toast.success('Member removed successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to remove member');
      },
    }
  );

  // Event handlers
  const handleJoin = (communityId) => {
    joinMutation.mutate(communityId);
  };

  const handleApply = (communityId) => {
    applyMutation.mutate(communityId);
  };

  const handleDelete = (communityId) => {
    if (window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      deleteMutation.mutate(communityId);
    }
  };

  const handleApprove = (membershipId) => {
    approveMutation.mutate({ membershipId });
  };

  const handleReject = (membershipId) => {
    rejectMutation.mutate(membershipId);
  };

  const handleRemoveMember = (membershipId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(membershipId);
    }
  };

  const getCommunityTypeIcon = (type) => {
    return type === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
  };

  const getCommunityTypeColor = (type) => {
    return type === 'public' ? 'text-green-600' : 'text-orange-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
            <p className="mt-1 text-sm text-gray-500">
              Join communities and connect with your neighbors
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded h-4 w-4"></div>
                  <div className="ml-2 bg-gray-300 rounded h-4 w-16"></div>
                </div>
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded h-4 w-4 mr-1"></div>
                  <div className="bg-gray-300 rounded h-4 w-8"></div>
                </div>
              </div>
              <div className="bg-gray-300 rounded h-6 w-3/4 mb-2"></div>
              <div className="bg-gray-300 rounded h-4 w-full mb-3"></div>
              <div className="bg-gray-300 rounded h-4 w-2/3 mb-4"></div>
              <div className="bg-gray-300 rounded h-8 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isManager ? 'Manage and create communities' : 'Join communities and connect with your neighbors'}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </button>
        )}
      </div>

      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Manager Status:</h3>
          <p className="text-xs text-blue-700">✅ User Type: {user?.user_type || 'undefined'}</p>
          <p className="text-xs text-blue-700">✅ Is Manager: {String(isManager)}</p>
          <p className="text-xs text-blue-700">✅ User ID: {user?.id || 'undefined'}</p>
        </div>
      )}

      {/* Manager Stats */}
      {isManager && managerStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Communities</p>
                <p className="text-2xl font-bold text-gray-900">{managerStats.total_communities}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{managerStats.total_members}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Public</p>
                <p className="text-2xl font-bold text-gray-900">{managerStats.public_communities}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Private</p>
                <p className="text-2xl font-bold text-gray-900">{managerStats.private_communities}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{managerStats.pending_applications}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search communities..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input pl-10"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="input"
          >
            <option value="">All Types</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', type: '' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => {
          const userIsMember = isUserMember(community);
          const userIsManager = community.admin?.id === user?.id;
          return (
            <div key={community.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getCommunityTypeIcon(community.community_type)}
                  <span className={`ml-2 text-sm font-medium ${getCommunityTypeColor(community.community_type)}`}>
                    {community.community_type || 'Unknown'}
                  </span>
                  {community.admin?.id === user?.id && (
                    <Crown className="h-4 w-4 ml-2 text-yellow-600" title="You are the admin" />
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {community.member_count || 0}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{community.name || 'Untitled Community'}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{community.description || 'No description available'}</p>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {community.location || 'Location not specified'}
              </div>

              {/* Features - Only show if user is a member */}
              {userIsMember && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {community.complaints_enabled && (
                      <span className="badge badge-info text-xs">Complaints</span>
                    )}
                    {community.notices_enabled && (
                      <span className="badge badge-info text-xs">Notices</span>
                    )}
                    {community.events_enabled && (
                      <span className="badge badge-info text-xs">Events</span>
                    )}
                    {community.vehicles_enabled && (
                      <span className="badge badge-info text-xs">Vehicles</span>
                    )}
                    {community.polls_enabled && (
                      <span className="badge badge-info text-xs">Polls</span>
                    )}
                  </div>
                </div>
              )}

              {/* Manager Actions - Only show to managers */}
              {userIsManager && (
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowManageModal(true);
                    }}
                    className="btn btn-secondary flex-1 text-sm"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowMembersModal(true);
                    }}
                    className="btn btn-info text-sm"
                    title="Manage Members"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(community.id)}
                    disabled={deleteMutation.isLoading}
                    className="btn btn-danger text-sm"
                    title="Delete Community"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Join/Apply Buttons - Only show if not a member */}
              {!userIsMember && (
                <div className="flex space-x-2">
                  {community.community_type === 'public' ? (
                    <button
                      onClick={() => handleJoin(community.id)}
                      disabled={joinMutation.isLoading}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      {joinMutation.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Join
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {canApplyToCommunity(community) ? (
                        <button
                          onClick={() => handleApply(community.id)}
                          disabled={applyMutation.isLoading}
                          className="btn btn-secondary flex-1 text-sm"
                        >
                          {applyMutation.isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-1" />
                              Apply
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 text-center">
                          <span className="text-sm text-gray-500">
                            {getUserMembershipStatus(community) === 'pending' ? 'Application Pending' : 'Private Community'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          {isManager ? (
            <>
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No communities yet</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                As a manager, you can create communities to bring people together.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Community
              </button>
            </>
          ) : (
            <>
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No communities available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new community or joining an existing one.
              </p>
            </>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('communities');
            queryClient.invalidateQueries('managerStats');
          }}
        />
      )}

      {/* Manage Community Modal */}
      {showManageModal && selectedCommunity && (
        <ManageCommunityModal
          community={selectedCommunity}
          onClose={() => {
            setShowManageModal(false);
            setSelectedCommunity(null);
          }}
          onSuccess={() => {
            setShowManageModal(false);
            setSelectedCommunity(null);
            queryClient.invalidateQueries('communities');
            queryClient.invalidateQueries('managerStats');
          }}
        />
      )}

      {/* Manage Members Modal */}
      {showMembersModal && selectedCommunity && (
        <ManageMembersModal
          community={selectedCommunity}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedCommunity(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onRemoveMember={handleRemoveMember}
          approveLoading={approveMutation.isLoading}
          rejectLoading={rejectMutation.isLoading}
          removeLoading={removeMemberMutation.isLoading}
        />
      )}
    </div>
  );
}

// Create Community Modal Component
function CreateCommunityModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    community_type: 'public',
    complaints_enabled: true,
    notices_enabled: true,
    events_enabled: true,
    vehicles_enabled: false,
    polls_enabled: true,
  });

  const createMutation = useMutation(communitiesAPI.create, {
    onSuccess: () => {
      toast.success('Community created successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create community');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Community</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input mt-1"
                rows="3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="community_type"
                value={formData.community_type}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="space-y-2">
                {[
                  { name: 'complaints_enabled', label: 'Complaints' },
                  { name: 'notices_enabled', label: 'Notices' },
                  { name: 'events_enabled', label: 'Events' },
                  { name: 'vehicles_enabled', label: 'Vehicles' },
                  { name: 'polls_enabled', label: 'Polls' },
                ].map((feature) => (
                  <label key={feature.name} className="flex items-center">
                    <input
                      type="checkbox"
                      name={feature.name}
                      checked={formData[feature.name]}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {createMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Manage Community Modal Component
function ManageCommunityModal({ community, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: community.name || '',
    description: community.description || '',
    location: community.location || '',
    community_type: community.community_type || 'public',
    complaints_enabled: community.complaints_enabled || false,
    notices_enabled: community.notices_enabled || false,
    events_enabled: community.events_enabled || false,
    vehicles_enabled: community.vehicles_enabled || false,
    polls_enabled: community.polls_enabled || false,
  });

  const updateMutation = useMutation(
    (data) => communitiesAPI.update(community.id, data),
    {
      onSuccess: () => {
        toast.success('Community updated successfully!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update community');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Community</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input mt-1"
                rows="3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="community_type"
                value={formData.community_type}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="space-y-2">
                {[
                  { name: 'complaints_enabled', label: 'Complaints' },
                  { name: 'notices_enabled', label: 'Notices' },
                  { name: 'events_enabled', label: 'Events' },
                  { name: 'vehicles_enabled', label: 'Vehicles' },
                  { name: 'polls_enabled', label: 'Polls' },
                ].map((feature) => (
                  <label key={feature.name} className="flex items-center">
                    <input
                      type="checkbox"
                      name={feature.name}
                      checked={formData[feature.name]}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {updateMutation.isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Manage Members Modal Component
function ManageMembersModal({ community, onClose, onApprove, onReject, onRemoveMember, approveLoading, rejectLoading, removeLoading }) {
  const { user } = useAuth(); // Add this line to get current user
  const [activeTab, setActiveTab] = useState('members');
  const [inviteValue, setInviteValue] = useState('');
  const [inviteType, setInviteType] = useState('email');
  const inviteMutation = useMutation(
    (data) => communitiesAPI.invite(community.id, data),
    {
      onSuccess: () => {
        toast.success('Invitation sent!');
        setInviteValue('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send invite');
      },
    }
  );
  
  const { data: members = [] } = useQuery(
    ['communityMembers', community.id],
    () => communitiesAPI.getMembers(community.id),
    {
      retry: 1,
      onError: (error) => console.log('Members API error:', error),
      refetchOnWindowFocus: false,
    }
  );

  const { data: pendingApplications = [], error: pendingError } = useQuery(
    ['pendingApplications', community.id],
    () => communitiesAPI.getPendingApplications(community.id),
    {
      retry: 1,
      onError: (error) => {
        console.log('Pending applications API error:', error);
        console.log('Error response:', error.response?.data);
        console.log('Error status:', error.response?.status);
      },
      refetchOnWindowFocus: false,
    }
  );

  const membersArray = Array.isArray(members) ? members : [];
  const pendingArray = Array.isArray(pendingApplications) ? pendingApplications : [];

  const approvedMembers = membersArray.filter(m => m.status === 'approved');
  const pendingMembers = pendingArray.filter(m => m.status === 'pending');

  // Debug info
  console.log('ManageMembersModal Debug:');
  console.log('Community:', community);
  console.log('Community admin:', community.admin);
  console.log('Community admin ID:', community.admin?.id);
  console.log('Current user from auth:', user);
  console.log('Current user ID:', user?.id);
  console.log('Is current user admin?:', community.admin?.id === user?.id);
  console.log('Pending applications:', pendingApplications);
  console.log('Pending applications array:', pendingArray);
  console.log('Pending error:', pendingError);
  console.log('Members:', members);
  console.log('Members array:', membersArray);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Manage Members - {community.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XSquare className="h-6 w-6" />
            </button>
          </div>

          {/* Invite Form - Only for managers */}
          {community.admin?.id === user?.id && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!inviteValue) return;
                inviteMutation.mutate(inviteType === 'email' ? { email: inviteValue } : { username: inviteValue });
              }}
              className="flex items-center mb-6 gap-2"
            >
              <select value={inviteType} onChange={e => setInviteType(e.target.value)} className="input w-32">
                <option value="email">Email</option>
                <option value="username">Username</option>
              </select>
              <input
                type="text"
                value={inviteValue}
                onChange={e => setInviteValue(e.target.value)}
                placeholder={`Enter ${inviteType}`}
                className="input flex-1"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviteMutation.isLoading}
              >
                {inviteMutation.isLoading ? 'Inviting...' : 'Invite'}
              </button>
            </form>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Members ({approvedMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Applications ({pendingMembers.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Approved Members</h4>
              {approvedMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {approvedMembers.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {membership.member?.user?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(membership.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveMember(membership.id)}
                        disabled={removeLoading}
                        className="btn btn-danger text-sm"
                      >
                        {removeLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Pending Applications</h4>
              {pendingMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending applications.</p>
              ) : (
                <div className="space-y-2">
                  {pendingMembers.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {membership.member?.user?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Applied: {new Date(membership.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onApprove(membership.id)}
                          disabled={approveLoading}
                          className="btn btn-success text-sm"
                        >
                          {approveLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onReject(membership.id)}
                          disabled={rejectLoading}
                          className="btn btn-danger text-sm"
                        >
                          {rejectLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Communities;