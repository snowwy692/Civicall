import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI, communitiesAPI } from '../utils/api';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

function Events() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    community: ''
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery('events', eventsAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Events API error:', error),
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
  const eventsArray = Array.isArray(events) ? events : 
                     (events?.results ? events.results : []);
  const communitiesArray = Array.isArray(communities) ? communities : 
                          (communities?.results ? communities.results : []);

  // Check if user is a manager with communities to manage
  console.log('DEBUG: user object:', user);
  console.log('DEBUG: user.is_manager:', user?.is_manager);
  console.log('DEBUG: communitiesArray:', communitiesArray);
  const isManagerWithCommunities = user?.is_manager && communitiesArray.length > 0;

  // Get current community based on filter
  const currentCommunity = filters.community ? 
    communitiesArray.find(c => c.id === parseInt(filters.community)) : null;

  // Check if user is the manager of the current community
  const isManagerOfCurrentCommunity = user?.is_manager && currentCommunity?.admin?.user?.id === user?.id;

  const createMutation = useMutation(eventsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      toast.success('Event created successfully!');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create event');
    },
  });

  const updateMutation = useMutation(eventsAPI.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      toast.success('Event updated successfully!');
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update event');
    },
  });

  const deleteMutation = useMutation(eventsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete event');
    },
  });

  const rsvpMutation = useMutation(
    ({ eventId, response }) => eventsAPI.rsvp(eventId, { response }),
    {
      onSuccess: (data, variables) => {
        // Optimistically update the cache
        queryClient.setQueryData('events', (oldData) => {
          if (!oldData) return oldData;
          
          const events = Array.isArray(oldData) ? oldData : (oldData.results || []);
          const updatedEvents = events.map(event => {
            if (event.id === variables.eventId) {
              return {
                ...event,
                user_rsvp: variables.response === 'yes' ? 'yes' : null
              };
            }
            return event;
          });
          
          return Array.isArray(oldData) ? updatedEvents : { ...oldData, results: updatedEvents };
        });
        
        // Also invalidate to ensure fresh data
        queryClient.invalidateQueries('events');
        toast.success('RSVP updated successfully!');
      },
      onError: (error) => {
        // Refresh data on error to ensure consistency
        queryClient.invalidateQueries('events');
        toast.error(error.response?.data?.error || 'Failed to update RSVP');
      },
    }
  );

  const filteredEvents = eventsArray.filter(event => {
    const matchesSearch = !filters.search || 
      event.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesCommunity = !filters.community || event.community?.id === parseInt(filters.community);
    
    return matchesSearch && matchesStatus && matchesCommunity;
  });

  const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate < now) return 'past';
    if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-green-600 bg-green-100';
      case 'today': return 'text-orange-600 bg-orange-100';
      case 'past': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (eventsLoading || communitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="mt-1 text-sm text-gray-500">Community events and gatherings</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Community events and gatherings</p>
        </div>
        {isManagerWithCommunities && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
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
            <option value="">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
          </select>
          <select
            value={filters.community}
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
          <button
            onClick={() => setFilters({ search: '', status: '', community: '' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEvents.map((event) => {
          const eventStatus = getEventStatus(event);
          return (
            <div key={event.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <span className={`badge ${getStatusColor(eventStatus)}`}>
                  {eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)}
                </span>
                <div className="flex items-center space-x-2">
                  {user?.is_manager && event.community?.admin?.user?.id === user.id && (
                    <>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="btn btn-secondary text-sm"
                        title="Edit event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(event.id)}
                        disabled={deleteMutation.isLoading}
                        className="btn btn-danger text-sm"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {event.title || 'Untitled Event'}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {event.description || 'No description available'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {event.time || 'Time TBD'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {event.venue || 'Venue TBD'}
                </div>
                {event.community && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {event.community.name || 'Unknown Community'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {event.rsvp_count || 0} RSVPs
                </div>
                {event.max_participants && (
                  <div className="text-sm text-gray-500">
                    Max: {event.max_participants}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {eventStatus !== 'past' && (
                  <button
                    onClick={() => rsvpMutation.mutate({ 
                      eventId: event.id, 
                      response: event.user_rsvp ? 'no' : 'yes' 
                    })}
                    disabled={rsvpMutation.isLoading}
                    className={`btn flex-1 text-sm ${
                      event.user_rsvp ? 'btn-secondary' : 'btn-primary'
                    }`}
                  >
                    {rsvpMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : event.user_rsvp ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel RSVP
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        RSVP
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="btn btn-secondary text-sm"
                >
                  <User className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sortedEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.community 
              ? 'Try adjusting your filters.' 
              : isManagerWithCommunities 
                ? 'No events available. Select a community to create events.'
                : 'No events available in your communities.'}
          </p>
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          communities={communitiesArray}
          selectedCommunity={currentCommunity}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isLoading}
        />
      )}

      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          communities={communitiesArray}
          onClose={() => setSelectedEvent(null)}
          onSubmit={(data) => updateMutation.mutate(selectedEvent.id, data)}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
}

function CreateEventModal({ communities, selectedCommunity, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    community: selectedCommunity?.id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.venue.trim()) {
      toast.error('Venue is required');
      return;
    }
    
    if (!formData.community) {
      toast.error('Please select a community');
      return;
    }
    
    if (!formData.date) {
      toast.error('Date is required');
      return;
    }
    
    // Check if date is in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Event date cannot be in the past');
      return;
    }
    
    // Convert community ID to integer
    const submitData = {
      ...formData,
      community: parseInt(formData.community),
      title: formData.title.trim(),
      description: formData.description.trim(),
      venue: formData.venue.trim()
    };
    
    onSubmit(submitData);
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedCommunity ? `Create Event for ${selectedCommunity.name}` : 'Create New Event'}
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
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input mt-1"
                rows="3"
                required
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="input mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Venue *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="input mt-1"
                required
                placeholder="Enter event venue"
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
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditEventModal({ event, communities, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date ? event.date.split('T')[0] : '',
    time: event.time || '',
    venue: event.venue || '',
    community: event.community?.id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.venue.trim()) {
      toast.error('Venue is required');
      return;
    }
    
    if (!formData.community) {
      toast.error('Please select a community');
      return;
    }
    
    if (!formData.date) {
      toast.error('Date is required');
      return;
    }
    
    // Convert community ID to integer
    const submitData = {
      ...formData,
      community: parseInt(formData.community),
      title: formData.title.trim(),
      description: formData.description.trim(),
      venue: formData.venue.trim()
    };
    
    onSubmit(submitData);
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event</h3>
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
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input mt-1"
                rows="3"
                required
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="input mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Venue *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="input mt-1"
                required
                placeholder="Enter event venue"
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
                {isLoading ? 'Updating...' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Events; 