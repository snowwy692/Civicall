import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { complaintsAPI, communitiesAPI } from '../utils/api';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  Search,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

function Complaints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  // Fetch data with proper error handling
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery('complaints', complaintsAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Complaints API error:', error),
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery('myCommunities', communitiesAPI.getMyCommunities, {
    retry: 1,
    onError: (error) => console.log('My Communities API error:', error),
    refetchOnWindowFocus: false,
  });

  // Ensure arrays and handle pagination
  const complaintsArray = Array.isArray(complaints) ? complaints : 
                         (complaints?.results ? complaints.results : []);
  const communitiesArray = Array.isArray(communities) ? communities : [];

  // Mutations
  const createMutation = useMutation(complaintsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('complaints');
      toast.success('Complaint created successfully!');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create complaint');
    },
  });



  const resolveMutation = useMutation(complaintsAPI.resolve, {
    onSuccess: () => {
      queryClient.invalidateQueries('complaints');
      toast.success('Complaint resolved successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to resolve complaint');
    },
  });

  // Filter complaints
  const filteredComplaints = complaintsArray.filter(complaint => {
    const matchesStatus = !filters.status || complaint.status === filters.status;
    const matchesPriority = !filters.priority || complaint.priority === filters.priority;
    // Fix: category is an object, so compare by name
    const matchesCategory = !filters.category || (complaint.category && (complaint.category.name === filters.category || complaint.category.id === filters.category));
    const matchesSearch = !filters.search || 
      complaint.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Debug logging
  console.log('Raw complaints data:', complaints);
  console.log('Complaints array:', complaintsArray);
  console.log('Filtered complaints:', filteredComplaints);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (complaintsLoading || communitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
            <p className="mt-1 text-sm text-gray-500">Report and track community issues</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-300 rounded h-4 w-20"></div>
                <div className="bg-gray-300 rounded h-4 w-16"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
          <p className="mt-1 text-sm text-gray-500">Report and track community issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input pl-10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="input"
          >
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="input"
          >
            <option value="">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="security">Security</option>
            <option value="noise">Noise</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={() => setFilters({ status: '', priority: '', category: '', search: '' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getStatusIcon(complaint.status)}
                <span className={`ml-2 badge ${getStatusColor(complaint.status)}`}>
                  {complaint.status?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
              <span className={`badge ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority || 'Normal'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {complaint.title || 'Untitled Complaint'}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {complaint.description || 'No description available'}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {complaint.community?.name || 'Unknown Community'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                {/* Fix: show submitted_by instead of reported_by */}
                {complaint.submitted_by?.user?.username || 'Unknown User'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Unknown Date'}
              </div>
            </div>

            {complaint.image && (
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Image attached
                </div>
                <img 
                  src={complaint.image} 
                  alt="Complaint" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedComplaint(complaint)}
                className="btn btn-secondary flex-1 text-sm"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                View Details
              </button>
              {complaint.status !== 'resolved' && (
                <button
                  onClick={() => resolveMutation.mutate(complaint.id)}
                  disabled={resolveMutation.isLoading}
                  className="btn btn-primary text-sm"
                >
                  {resolveMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.priority || filters.category 
              ? 'Try adjusting your filters.' 
              : complaintsArray.length === 0 
                ? 'No complaints available. Join a community to see complaints or create your first one.'
                : 'Get started by reporting a new issue.'}
          </p>
          {complaintsArray.length === 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400">
                Debug: Total complaints in array: {complaintsArray.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Complaint Modal */}
      {showCreateModal && (
        <CreateComplaintModal
          communities={communitiesArray}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isLoading}
        />
      )}

      {/* View Complaint Modal */}
      {selectedComplaint && (
        <ViewComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}

// Create Complaint Modal
function CreateComplaintModal({ communities, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    priority: 'normal',
    community: '',
    image: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert community ID to integer if it's a string
    const submitData = {
      ...formData,
      community: parseInt(formData.community) || formData.community
    };
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report New Issue</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
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
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="infrastructure">Infrastructure</option>
                <option value="security">Security</option>
                <option value="noise">Noise</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Community</label>
              <select
                name="community"
                value={formData.community}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="">
                  {communities.length === 0 ? 'No communities available - Join a community first' : 'Select Community'}
                </option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
              {communities.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  You need to join a community before you can file complaints.
                </p>
              )}
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
                {isLoading ? 'Creating...' : 'Create Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// View Complaint Modal
function ViewComplaintModal({ complaint, onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Complaint Details</h3>
          
          {complaint.image && (
            <div className="mb-4">
              <img 
                src={complaint.image} 
                alt="Complaint" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.title || 'No title'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.description || 'No description'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.priority || 'Normal'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.status?.replace('_', ' ') || 'Unknown'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Community</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.community?.name || 'Unknown Community'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Submitted By</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.submitted_by?.user?.username || 'Unknown User'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Unknown Date'}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Complaints; 