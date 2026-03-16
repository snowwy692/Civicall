import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { pollsAPI, communitiesAPI } from '../utils/api';
import { 
  Plus, 
  Vote, 
  Search,
  Calendar,
  Users,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

function Polls() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    community: ''
  });

  const { data: polls = [], isLoading: pollsLoading } = useQuery('polls', pollsAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Polls API error:', error),
    refetchOnWindowFocus: false,
  });

  // Managers: managed communities, Members: my approved communities
  const { data: communities = [], isLoading: communitiesLoading } = useQuery(
    user?.is_manager ? 'myManagedCommunities' : 'myCommunities',
    user?.is_manager ? communitiesAPI.getMyManagedCommunities : communitiesAPI.getMyCommunities,
    {
      retry: 1,
      onError: (error) => console.log('Communities API error:', error),
      refetchOnWindowFocus: false,
    }
  );

  const pollsArray = Array.isArray(polls) ? polls : (polls?.results ? polls.results : []);
  const communitiesArray = Array.isArray(communities) ? communities : (communities?.results ? communities.results : []);

  // Default-select first community if none selected
  useEffect(() => {
    if (communitiesArray.length > 0 && !filters.community) {
      setFilters(prev => ({ ...prev, community: String(communitiesArray[0].id) }));
    }
  }, [communitiesArray]);

  const currentCommunity = filters.community
    ? communitiesArray.find(c => c.id === parseInt(filters.community))
    : (communitiesArray.length > 0 ? communitiesArray[0] : null);

  const isMemberOrManagerOfCurrent = !!currentCommunity && (
    // user.profile.user.id compared via nested structure
    (currentCommunity?.admin?.user?.id === user?.id) || true // backend filters already restrict visible polls/communities
  );

  const createMutation = useMutation(pollsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('polls');
      toast.success('Poll created successfully!');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to create poll');
    },
  });

  const voteMutation = useMutation(pollsAPI.vote, {
    onSuccess: () => {
      queryClient.invalidateQueries('polls');
      toast.success('Vote submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit vote');
    },
  });

  const getPollStatus = (poll) => {
    const now = new Date();
    const endDate = new Date(poll.end_date);
    return endDate < now ? 'closed' : 'active';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  if (pollsLoading || communitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
            <p className="mt-1 text-sm text-gray-500">Community voting and surveys</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
          <p className="mt-1 text-sm text-gray-500">Community voting and surveys</p>
        </div>
        {currentCommunity && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
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
              placeholder="Search polls..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input pl-10 w-full"
            />
          </div>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pollsArray
          .filter(p => !filters.community || p.community?.id === parseInt(filters.community))
          .filter(p => !filters.search || (p.question?.toLowerCase().includes(filters.search.toLowerCase()) || p.description?.toLowerCase().includes(filters.search.toLowerCase())))
          .map((poll) => {
          const status = getPollStatus(poll);
          const totalVotes = poll.vote_count || 0;
          const options = poll.poll_type === 'multiple_choice' ? (poll.options || []) : ['yes', 'no'];
          
          // votes per option for percentage display (requires results endpoint to enrich, simplified here)
          return (
            <div key={poll.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <span className={`badge ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {totalVotes} votes
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {poll.question || 'Untitled Poll'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {poll.description || 'No description available'}
              </p>

              <div className="space-y-2 mb-4">
                {options.map((option) => {
                  const label = option.text || option; // option may be string
                  const disabled = status === 'closed' || voteMutation.isLoading || !!poll.user_vote;
                  const isSelected = poll.user_vote && (poll.poll_type === 'multiple_choice' ? poll.user_vote === label : poll.user_vote === label.toLowerCase());
                  const handleVote = () => {
                    if (status !== 'active' || disabled) return;
                    const choice = poll.poll_type === 'multiple_choice' ? label : (label.toLowerCase());
                    voteMutation.mutate({ id: poll.id, data: { choice } });
                  };
                  return (
                    <div key={label} className="relative">
                      <button
                        onClick={handleVote}
                        disabled={disabled}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                        } ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {label}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-primary-600">Your vote</span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Ends: {poll.end_date ? new Date(poll.end_date).toLocaleDateString() : 'No end date'}
                </div>
                {poll.community && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {poll.community.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pollsArray.length === 0 && (
        <div className="text-center py-12">
          <Vote className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No polls found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {currentCommunity ? 'Be the first to create a poll for this community.' : 'Select a community to create a poll.'}
          </p>
        </div>
      )}

      {showCreateModal && (
        <CreatePollModal
          communities={communitiesArray}
          selectedCommunity={currentCommunity}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isLoading}
        />
      )}
    </div>
  );
}

function CreatePollModal({ communities, selectedCommunity, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    poll_type: 'multiple_choice',
    options: ['', ''],
    end_date: '',
    community: selectedCommunity?.id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!formData.community) {
      toast.error('Please select a community');
      return;
    }
    if (!formData.end_date) {
      toast.error('Please select an end date');
      return;
    }

    const payload = { ...formData };

    if (payload.poll_type === 'multiple_choice') {
      const clean = (payload.options || []).map(o => String(o).trim()).filter(Boolean);
      if (clean.length < 2) {
        toast.error('Please provide at least 2 options');
        return;
      }
      payload.options = clean;
    } else {
      payload.options = [];
    }

    payload.community = parseInt(payload.community);

    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
  const removeOption = (index) => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  const updateOption = (index, value) => setFormData(prev => ({ ...prev, options: prev.options.map((o, i) => i === index ? value : o) }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Poll</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Question *</label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleChange}
                className="input mt-1"
                required
                placeholder="Enter poll question"
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
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Poll Type *</label>
              <select
                name="poll_type"
                value={formData.poll_type}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no">Yes / No</option>
              </select>
            </div>

            {formData.poll_type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Options *</label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="input flex-1"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addOption} className="text-sm text-primary-600 hover:text-primary-700">+ Add Option</button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            {selectedCommunity ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Community</label>
                <input type="text" value={selectedCommunity.name} className="input mt-1 bg-gray-100" disabled />
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
                  <option value="">Select Community</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>{community.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
                {isLoading ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Polls; 