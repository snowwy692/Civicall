import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import {
  Users,
  AlertTriangle,
  Bell,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';



function Dashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats from the new API endpoint
  const { 
    data: stats = {}, 
    error: statsError,
    isLoading: statsLoading 
  } = useQuery('dashboardStats', () => api.get('/dashboard/stats/').then(res => res.data), {
    retry: 1,
    onError: (error) => console.log('Dashboard stats API error:', error),
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Check if data is still loading
  const isLoading = statsLoading;

  const dashboardStats = [
    {
      name: 'Communities',
      value: stats.total_communities || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Complaints',
      value: stats.active_complaints || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Total Notices',
      value: stats.total_notices || 0,
      icon: Bell,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Events',
      value: stats.total_events || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
  ];

  const recentComplaints = stats.recent_complaints || [];
  const recentNotices = stats.recent_notices || [];
  const upcomingEvents = stats.upcoming_events || [];

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    switch (status) {
      case 'open':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'text-gray-600 bg-gray-100';
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'urgent':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.user?.first_name || user?.user?.username}!
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-300 rounded-md p-3 h-12 w-12"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading dashboard data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.user?.first_name || user?.user?.username}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Complaints
            </h3>
            <div className="space-y-4">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{complaint.title || 'Untitled'}</h4>
                        <p className="text-sm text-gray-500">{complaint.community || 'Unknown Community'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`badge ${getStatusColor(complaint.status)}`}>
                          {complaint.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                        <span className={`badge ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority || 'Normal'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent complaints</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Notices
            </h3>
            <div className="space-y-4">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice) => (
                  <div key={notice.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{notice.title || 'Untitled'}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {notice.community || 'Unknown Community'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent notices</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Upcoming Events
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{event.title || 'Untitled Event'}</h4>
                        <p className="text-sm text-gray-500 mt-1">{event.community || 'Unknown Community'}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                          </span>
                          <span>{event.venue || 'Location TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No upcoming events</p>
              )}
            </div>
          </div>
                 </div>
       </div>
     </div>
   );
 }

export default Dashboard; 