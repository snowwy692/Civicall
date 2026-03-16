import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API functions for different endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  refresh: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
};

export const communitiesAPI = {
  getAll: () => api.get('/communities/').then(res => res.data),
  getById: (id) => api.get(`/communities/${id}/`),
  create: (data) => api.post('/communities/', data),
  update: (id, data) => api.put(`/communities/${id}/`, data),
  delete: (id) => api.delete(`/communities/${id}/`),
  join: (id) => api.post(`/communities/${id}/join/`),
  apply: (id) => api.post(`/communities/${id}/apply/`).then(res => res.data),
  getMembers: (id) => api.get(`/communities/${id}/members/`),
  getPendingApplications: (id) => api.get(`/communities/${id}/pending_applications/`),
  getApprovedMembers: (id) => api.get(`/communities/${id}/approved_members/`),
  getCommunityStats: (id) => api.get(`/communities/${id}/community_stats/`),
  getMyManagedCommunities: () => api.get('/communities/my_managed_communities/').then(res => res.data),
  getManagerStats: () => api.get('/communities/manager_stats/'),
  getMyCommunities: () => api.get('/communities/my_communities/').then(res => res.data),
  getMyMemberships: () => api.get('/memberships/my_memberships/').then(res => res.data),
  invite: (communityId, data) => api.post(`/communities/${communityId}/invite/`, data),
  acceptInvite: (communityId) => api.post(`/communities/${communityId}/accept_invite/`),
};

export const membershipsAPI = {
  getAll: () => api.get('/memberships/'),
  getById: (id) => api.get(`/memberships/${id}/`),
  approve: (id, data) => api.post(`/memberships/${id}/approve/`, data),
  reject: (id) => api.post(`/memberships/${id}/reject/`),
  removeMember: (id) => api.post(`/memberships/${id}/remove_member/`),
  delete: (id) => api.delete(`/memberships/${id}/`),
  getMyInvites: () => api.get('/memberships/my_invites/').then(res => res.data),
};

export const complaintsAPI = {
  getAll: (params) => api.get('/complaints/', { params }).then(res => res.data),
  getById: (id) => api.get(`/complaints/${id}/`).then(res => res.data),
  create: (data) => {
    // Handle file upload
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'image' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    return api.post('/complaints/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => {
    // Ensure only valid fields are sent
    const validFields = ['title', 'description', 'priority'];
    const cleanData = {};
    
    validFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        cleanData[field] = data[field];
      }
    });
    
    console.log('Sending complaint update data:', cleanData);
    console.log('Complaint ID:', id);
    console.log('API URL:', `/complaints/${id}/`);
    // Use PATCH for partial updates instead of PUT
    return api.patch(`/complaints/${id}/`, cleanData);
  },
  delete: (id) => api.delete(`/complaints/${id}/`),
  resolve: (id) => api.post(`/complaints/${id}/resolve/`),
  getMyComplaints: () => api.get('/complaints/my_complaints/').then(res => res.data),
  getPending: () => api.get('/complaints/pending/').then(res => res.data),
  getUrgent: () => api.get('/complaints/urgent/').then(res => res.data),
};

export const noticesAPI = {
  getAll: (params) => api.get('/notices/', { params }).then(res => res.data),
  getById: (id) => api.get(`/notices/${id}/`).then(res => res.data),
  create: (data) => {
    // Handle file upload
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if ((key === 'image' || key === 'attachment') && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    return api.post('/notices/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => {
    // Handle file upload for updates
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if ((key === 'image' || key === 'attachment') && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    return api.put(`/notices/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/notices/${id}/`),
};

export const eventsAPI = {
  getAll: (params) => api.get('/events/', { params }).then(res => res.data),
  getById: (id) => api.get(`/events/${id}/`).then(res => res.data),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}/`, data),
  delete: (id) => api.delete(`/events/${id}/`),
  rsvp: (id, data) => api.post(`/events/${id}/rsvp/`, data),
  getMyEvents: () => api.get('/events/my_events/').then(res => res.data),
  getUpcoming: () => api.get('/events/upcoming/').then(res => res.data),
};

// vehiclesAPI removed

export const pollsAPI = {
  getAll: (params) => api.get('/polls/', { params }).then(res => res.data),
  getById: (id) => api.get(`/polls/${id}/`).then(res => res.data),
  create: (data) => api.post('/polls/', data).then(res => res.data),
  update: (id, data) => api.put(`/polls/${id}/`, data).then(res => res.data),
  delete: (id) => api.delete(`/polls/${id}/`).then(res => res.data),
  vote: ({ id, data }) => api.post(`/polls/${id}/vote/`, data).then(res => res.data),
  getResults: (id) => api.get(`/polls/${id}/results/`).then(res => res.data),
  getMyPolls: () => api.get('/polls/my_polls/').then(res => res.data),
  getActive: () => api.get('/polls/active/').then(res => res.data),
};

export const profilesAPI = {
  getMyProfile: () => api.get('/profiles/me/'),
  updateProfile: (id, data) => api.put(`/profiles/${id}/`, data),
  uploadProfilePicture: (id, data) => api.patch(`/profiles/${id}/`, data),
};

export const aiAPI = {
  enhanceText: (data) => api.post('/ai/enhance_text/', data),
  fixGrammar: (data) => api.post('/ai/fix_grammar/', data),
  rephraseText: (data) => api.post('/ai/rephrase_text/', data),
};

export const adminAPI = {
  promoteToManager: (userId) => api.post('/promote-to-manager/', { user_id: userId }),
  getAllUsers: () => api.get('/profiles/'),
  getUserStats: () => api.get('/admin/user_stats/'),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications/').then(res => res.data),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
};

export const auditLogsAPI = {
  getAuditLogs: () => api.get('/audit-logs/').then(res => res.data),
};

export default api; 