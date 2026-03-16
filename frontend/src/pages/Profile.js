import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { communitiesAPI } from '../utils/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Camera,
  Shield,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

function Profile() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.user?.first_name || '',
    last_name: user?.user?.last_name || '',
    email: user?.user?.email || '',
    phone_number: user?.phone_number || '',
    address: user?.address || '',
    user_type: user?.user_type || 'member'
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery('communities', communitiesAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Communities API error:', error),
    refetchOnWindowFocus: false,
  });

  const communitiesArray = Array.isArray(communities) ? communities : [];

  const updateMutation = useMutation(updateProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries('communities');
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.user?.first_name || '',
      last_name: user?.user?.last_name || '',
      email: user?.user?.email || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      user_type: user?.user_type || 'member'
    });
    setIsEditing(false);
  };

  const { data: myCommunities = [], isLoading: myCommunitiesLoading } = useQuery('myCommunities', communitiesAPI.getMyCommunities, {
    retry: 1,
    onError: (error) => console.log('My Communities API error:', error),
    refetchOnWindowFocus: false,
  });

  const { data: myInvites = [], isLoading: myInvitesLoading } = useQuery('myInvites', communitiesAPI.getMyInvites, {
    retry: 1,
    onError: (error) => console.log('My Invites API error:', error),
    refetchOnWindowFocus: false,
  });
  
  const acceptInviteMutation = useMutation(
    (communityId) => communitiesAPI.acceptInvite(communityId),
    {
      onSuccess: () => {
        toast.success('Invite accepted!');
        queryClient.invalidateQueries('myInvites');
        queryClient.invalidateQueries('myCommunities');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to accept invite');
      },
    }
  );



  if (communitiesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account information</p>
        </div>
        <div className="card animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gray-300 rounded-full h-20 w-20"></div>
            <div className="space-y-2">
              <div className="bg-gray-300 rounded h-6 w-32"></div>
              <div className="bg-gray-300 rounded h-4 w-24"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-300 rounded h-4 w-full"></div>
            <div className="bg-gray-300 rounded h-4 w-3/4"></div>
            <div className="bg-gray-300 rounded h-4 w-1/2"></div>
                  </div>
      </div>


    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="btn btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isLoading}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.user?.first_name?.[0] || user?.user?.username?.[0] || 'U'}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.user?.first_name} {user?.user?.last_name}
                </h2>
                <p className="text-sm text-gray-500">@{user?.user?.username}</p>
                <div className="flex items-center mt-1">
                  <Shield className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600 capitalize">
                    {user?.user_type || 'member'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="input mt-1"
                      required
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.user?.first_name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="input mt-1"
                      required
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.user?.last_name || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input mt-1"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.user?.email || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="input mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.phone_number || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input mt-1"
                    rows="3"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.address || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                {isEditing ? (
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    className="input mt-1"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {user?.user_type || 'member'}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Communities</span>
                <span className="text-sm font-medium text-gray-900">
                  {myCommunities.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>

          {/* My Communities */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Communities</h3>
            {myCommunities.length > 0 ? (
              <div className="space-y-3">
                {myCommunities.slice(0, 5).map((community) => (
                  <div key={community.id} className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {community.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {community.community_type}
                      </p>
                    </div>
                  </div>
                ))}
                {myCommunities.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{myCommunities.length - 5} more communities
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">You haven't joined any communities yet.</p>
            )}
          </div>

          {/* Pending Invites */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invites</h3>
            {myInvitesLoading ? (
              <div className="text-sm text-gray-500">Loading invites...</div>
            ) : myInvites.length > 0 ? (
              <div className="space-y-3">
                {myInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invite.community?.name || invite.community_name || 'Unknown Community'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {invite.community?.community_type || 'Community'}
                      </p>
                    </div>
                    <button
                      className="btn btn-success btn-sm"
                      disabled={acceptInviteMutation.isLoading}
                      onClick={() => acceptInviteMutation.mutate(invite.community?.id || invite.community_id)}
                    >
                      {acceptInviteMutation.isLoading ? 'Accepting...' : 'Accept'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending invites.</p>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}

export default Profile; 