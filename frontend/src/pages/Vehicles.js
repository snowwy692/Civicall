import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { vehiclesAPI, communitiesAPI } from '../utils/api';
import { 
  Plus, 
  Car, 
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Calendar,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

function Vehicles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    community: ''
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery('vehicles', vehiclesAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Vehicles API error:', error),
    refetchOnWindowFocus: false,
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery('communities', communitiesAPI.getAll, {
    retry: 1,
    onError: (error) => console.log('Communities API error:', error),
    refetchOnWindowFocus: false,
  });

  const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
  const communitiesArray = Array.isArray(communities) ? communities : [];

  const createMutation = useMutation(vehiclesAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles');
      toast.success('Vehicle registered successfully!');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to register vehicle');
    },
  });

  const updateMutation = useMutation(vehiclesAPI.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles');
      toast.success('Vehicle updated successfully!');
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update vehicle');
    },
  });

  const deleteMutation = useMutation(vehiclesAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles');
      toast.success('Vehicle deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle');
    },
  });

  const filteredVehicles = vehiclesArray.filter(vehicle => {
    const matchesSearch = !filters.search || 
      vehicle.license_plate?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || vehicle.status === filters.status;
    const matchesCommunity = !filters.community || vehicle.community?.id === parseInt(filters.community);
    
    return matchesSearch && matchesStatus && matchesCommunity;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (vehiclesLoading || communitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="mt-1 text-sm text-gray-500">Vehicle registration and management</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-1 text-sm text-gray-500">Vehicle registration and management</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register Vehicle
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
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
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <span className={`badge ${getStatusColor(vehicle.status)}`}>
                {vehicle.status || 'Unknown'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="btn btn-secondary text-sm"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(vehicle.id)}
                  disabled={deleteMutation.isLoading}
                  className="btn btn-danger text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {vehicle.make || 'Unknown'} {vehicle.model || 'Vehicle'}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              License: {vehicle.license_plate || 'Not provided'}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                {vehicle.owner?.user?.username || 'Unknown Owner'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : 'Unknown Date'}
              </div>
              {vehicle.community && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {vehicle.community.name || 'Unknown Community'}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p>Color: {vehicle.color || 'Not specified'}</p>
              <p>Year: {vehicle.year || 'Not specified'}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.community 
              ? 'Try adjusting your filters.' 
              : 'Get started by registering a new vehicle.'}
          </p>
        </div>
      )}

      {showCreateModal && (
        <CreateVehicleModal
          communities={communitiesArray}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isLoading}
        />
      )}

      {selectedVehicle && (
        <EditVehicleModal
          vehicle={selectedVehicle}
          communities={communitiesArray}
          onClose={() => setSelectedVehicle(null)}
          onSubmit={(data) => updateMutation.mutate(selectedVehicle.id, data)}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
}

function CreateVehicleModal({ communities, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    license_plate: '',
    color: '',
    year: '',
    community: '',
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Register New Vehicle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate</label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input mt-1"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
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
                <option value="">Select Community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
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
                {isLoading ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditVehicleModal({ vehicle, communities, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    make: vehicle.make || '',
    model: vehicle.model || '',
    license_plate: vehicle.license_plate || '',
    color: vehicle.color || '',
    year: vehicle.year || '',
    community: vehicle.community?.id || '',
    status: vehicle.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Vehicle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="input mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate</label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input mt-1"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
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
                <option value="">Select Community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
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
                {isLoading ? 'Updating...' : 'Update Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Vehicles; 