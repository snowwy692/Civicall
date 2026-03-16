import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { noticesAPI, communitiesAPI } from '../utils/api';
import { 
  Plus, 
  Bell, 
  Pin, 
  Search,
  Calendar,
  User,
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

function Notices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    is_pinned: false,
    community: ''
  });

  // Fetch data with proper error handling
  const { data: notices = [], isLoading: noticesLoading } = useQuery('notices', noticesAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Notices API error:', error),
    refetchOnWindowFocus: false,
  });

  // Fetch communities - managers see communities they manage, members see communities they belong to
  const { data: communities = [], isLoading: communitiesLoading } = useQuery(
    user?.is_manager ? 'myManagedCommunities' : 'myCommunities', 
    user?.is_manager ? communitiesAPI.getMyManagedCommunities : communitiesAPI.getMyCommunities, 
    {
      retry: 1,
      onError: (error) => console.log('Communities API error:', error),
      refetchOnWindowFocus: false,
    }
  );

  // Ensure arrays
  const noticesArray = Array.isArray(notices) ? notices : 
                      (notices?.results ? notices.results : []);
  const communitiesArray = Array.isArray(communities) ? communities : 
                          (communities?.results ? communities.results : []);

  // Default-select first managed community for managers
  useEffect(() => {
    if (user?.is_manager && communitiesArray.length > 0 && !filters.community) {
      setFilters(prev => ({ ...prev, community: String(communitiesArray[0].id) }));
    }
  }, [user?.is_manager, communitiesArray]);

  // Check if user is a manager with communities to manage
  console.log('DEBUG: user object:', user);
  console.log('DEBUG: user.is_manager:', user?.is_manager);
  console.log('DEBUG: communitiesArray:', communitiesArray);
  const isManagerWithCommunities = user?.is_manager && communitiesArray.length > 0;

  // Get current community based on filter, default to first if none selected
  const currentCommunity = filters.community
    ? communitiesArray.find(c => c.id === parseInt(filters.community))
    : (communitiesArray.length > 0 ? communitiesArray[0] : null);

  // Check if user is the manager of the current community
  const isManagerOfCurrentCommunity = user?.is_manager && (currentCommunity?.admin?.user?.id === user?.id);

  // Mutations
  const createMutation = useMutation(noticesAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('notices');
      toast.success('Notice created successfully!');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create notice');
    },
  });

  const updateMutation = useMutation(noticesAPI.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('notices');
      toast.success('Notice updated successfully!');
      setSelectedNotice(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update notice');
    },
  });

  const deleteMutation = useMutation(noticesAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('notices');
      toast.success('Notice deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete notice');
    },
  });

  // Filter notices
  const filteredNotices = noticesArray.filter(notice => {
    const matchesSearch = !filters.search || 
      notice.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      notice.message?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPinned = !filters.is_pinned || notice.is_pinned;
    const matchesCommunity = !filters.community || notice.community?.id === parseInt(filters.community);
    
    return matchesSearch && matchesPinned && matchesCommunity;
  });

  // Sort notices: pinned first, then by date
  const sortedNotices = filteredNotices.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (noticesLoading || communitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        {isManagerWithCommunities && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search notices..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input pl-10 w-full"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filters.community || currentCommunity?.id || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, community: e.target.value }))}
            className="input"
          >
            <option value="">All Communities</option>
            {communitiesArray.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.is_pinned}
              onChange={(e) => setFilters(prev => ({ ...prev, is_pinned: e.target.checked }))}
              className="checkbox"
            />
            <span className="text-sm text-gray-600">Pinned only</span>
          </label>
        </div>
      </div>

      {/* Notices List */}
      {sortedNotices.length > 0 ? (
        <div className="grid gap-4">
          {sortedNotices.map(notice => (
            <div key={notice.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {notice.is_pinned && <Pin className="h-4 w-4 text-red-500" />}
                  <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {user?.is_manager && notice.community?.admin?.user?.id === user?.id && (
                    <>
                      <button
                        onClick={() => setSelectedNotice(notice)}
                        className="btn btn-secondary btn-sm"
                        title="Edit notice"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(notice.id)}
                        disabled={deleteMutation.isLoading}
                        className="btn btn-danger btn-sm"
                        title="Delete notice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4 whitespace-pre-wrap">{notice.message}</p>

              {/* File attachments */}
              {(notice.image || notice.attachment) && (
                <div className="mb-4">
                  <div className="flex items-center space-x-4">
                    {notice.image && (
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Image attached</span>
                      </div>
                    )}
                    {notice.attachment && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">File attached</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{notice.posted_by?.user?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                  </div>
                  {notice.community && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {notice.community.name}
                    </span>
                  )}
                </div>
                {!notice.is_active && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.is_pinned || filters.community
              ? 'Try adjusting your filters.' 
              : isManagerWithCommunities 
                ? 'No notices available. Select a community to create notices.'
                : 'No notices available in your communities.'}
          </p>
        </div>
      )}

      {/* Create Notice Modal */}
      {showCreateModal && (
        <CreateNoticeModal
          communities={communitiesArray}
          selectedCommunity={currentCommunity}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isLoading}
        />
      )}

      {/* Edit Notice Modal */}
      {selectedNotice && (
        <EditNoticeModal
          notice={selectedNotice}
          communities={communitiesArray}
          onClose={() => setSelectedNotice(null)}
          onSubmit={(data) => updateMutation.mutate([selectedNotice.id, data])}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
}

// Create Notice Modal
function CreateNoticeModal({ communities, selectedCommunity, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    community: selectedCommunity?.id || '',
    is_pinned: false,
    image: null,
    attachment: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }
    
    if (!formData.community) {
      toast.error('Please select a community');
      return;
    }
    
    // Convert community ID to integer
    const submitData = {
      ...formData,
      community: parseInt(formData.community),
      title: formData.title.trim(),
      message: formData.message.trim()
    };
    
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedCommunity ? `Create Notice for ${selectedCommunity.name}` : 'Create New Notice'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input mt-1"
                required
                placeholder="Enter notice title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="input mt-1"
                rows="4"
                required
                placeholder="Enter notice message"
              />
            </div>

            {selectedCommunity ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Community</label>
                <input
                  type="text"
                  value={selectedCommunity.name}
                  className="input mt-1 bg-gray-100"
                  disabled
                />
                <input type="hidden" name="community" value={selectedCommunity.id} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Community *</label>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                >
                  <option value="">Select a community</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="input mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                className="input mt-1"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleChange}
                  className="checkbox"
                />
                <span className="text-sm text-gray-700">Pin to top</span>
              </label>
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
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Notice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Notice Modal
function EditNoticeModal({ notice, communities, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: notice.title || '',
    message: notice.message || '',
    community: notice.community?.id || '',
    is_pinned: notice.is_pinned || false,
    image: null,
    attachment: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }
    
    if (!formData.community) {
      toast.error('Please select a community');
      return;
    }
    
    // Convert community ID to integer
    const submitData = {
      ...formData,
      community: parseInt(formData.community),
      title: formData.title.trim(),
      message: formData.message.trim()
    };
    
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Notice</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input mt-1"
                required
                placeholder="Enter notice title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="input mt-1"
                rows="4"
                required
                placeholder="Enter notice message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Community *</label>
              <select
                name="community"
                value={formData.community}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="">Select a community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="input mt-1"
              />
              {notice.image && (
                <p className="text-xs text-gray-500 mt-1">Current image will be replaced</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                className="input mt-1"
              />
              {notice.attachment && (
                <p className="text-xs text-gray-500 mt-1">Current attachment will be replaced</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleChange}
                  className="checkbox"
                />
                <span className="text-sm text-gray-700">Pin to top</span>
              </label>
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
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Updating...' : 'Update Notice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Notices; 