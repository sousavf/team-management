/*
 * Team Management System
 * Copyright (C) 2025
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from 'react';
import { TimeOffRequest, TimeOffRequestCreate } from '../types';
import { timeOffApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import AdminHolidayModal from '../components/AdminHolidayModal';

const TimeOff: React.FC = () => {
  const { state } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showAdminHolidayModal, setShowAdminHolidayModal] = useState(false);
  const [formData, setFormData] = useState<TimeOffRequestCreate>({
    startDate: '',
    endDate: '',
    type: 'VACATION',
    reason: '',
  });

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter.toUpperCase() } : {};
      const response = await timeOffApi.getRequests(params);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load time-off requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeOffApi.createRequest(formData);
      toast.success('Time-off request submitted successfully');
      setShowCreateForm(false);
      setFormData({
        startDate: '',
        endDate: '',
        type: 'VACATION',
        reason: '',
      });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create request');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await timeOffApi.updateRequest(requestId, { status: 'APPROVED' });
      toast.success('Request approved');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await timeOffApi.updateRequest(requestId, { status: 'REJECTED' });
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await timeOffApi.deleteRequest(requestId);
        toast.success('Request deleted');
        fetchRequests();
      } catch (error) {
        toast.error('Failed to delete request');
      }
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelRequestId) return;
    
    try {
      await timeOffApi.cancelRequest(cancelRequestId, { cancellationReason });
      toast.success('Request cancelled');
      setShowCancelModal(false);
      setCancelRequestId(null);
      setCancellationReason('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel request');
    }
  };

  const openCancelModal = (requestId: string) => {
    setCancelRequestId(requestId);
    setShowCancelModal(true);
  };

  const canApprove = () => {
    return ['ADMIN', 'MANAGER', 'QA_MANAGER'].includes(state.user?.role || '');
  };

  const canCreateTimeOff = () => {
    return state.user?.role !== 'VIEW_ONLY';
  };

  const canDelete = (request: TimeOffRequest) => {
    // VIEW_ONLY users cannot delete any requests
    if (state.user?.role === 'VIEW_ONLY') {
      return false;
    }

    // Users can delete their own pending requests
    if (request.userId === state.user?.id && request.status === 'PENDING') {
      return true;
    }
    
    // Admins, managers, and QA managers can delete any pending request
    if (['ADMIN', 'MANAGER', 'QA_MANAGER'].includes(state.user?.role || '') && request.status === 'PENDING') {
      return true;
    }
    
    // Admins can delete approved admin-created holidays
    if (state.user?.role === 'ADMIN' && request.isAdminCreated && request.status === 'APPROVED') {
      return true;
    }
    
    // Managers and QA managers can delete their own approved requests
    if (['MANAGER', 'QA_MANAGER'].includes(state.user?.role || '') && request.userId === state.user?.id && request.status === 'APPROVED') {
      return true;
    }
    
    // Admins can delete rejected requests
    if (state.user?.role === 'ADMIN' && request.status === 'REJECTED') {
      return true;
    }
    
    return false;
  };

  const canCancel = (request: TimeOffRequest) => {
    return state.user?.role !== 'VIEW_ONLY' && 
           request.userId === state.user?.id && 
           request.status === 'APPROVED' && 
           !request.isAdminCreated;
  };

  const isAdmin = () => {
    return state.user?.role === 'ADMIN';
  };

  const canCreateTeamHoliday = () => {
    return ['ADMIN', 'MANAGER', 'QA_MANAGER'].includes(state.user?.role || '');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      case 'CANCELLED':
        return 'badge-secondary';
      default:
        return 'badge-warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'CANCELLED':
        return <XMarkIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK_LEAVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Time Off Management</h1>
        <div className="flex space-x-3">
          {canCreateTeamHoliday() && (
            <button
              onClick={() => setShowAdminHolidayModal(true)}
              className="btn-secondary"
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              Create Team Holiday
            </button>
          )}
          {canCreateTimeOff() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Request Time Off
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="input w-auto"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Request Time Off</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="input"
                >
                  <option value="VACATION">Vacation</option>
                  <option value="SICK_LEAVE">Sick Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="input"
                  rows={3}
                  placeholder="Please provide a reason for your time off request"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Cancel Time-Off Request</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this time-off request? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="label">Cancellation Reason (Optional)</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="input"
                rows={3}
                placeholder="Please provide a reason for cancelling this request"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelRequestId(null);
                  setCancellationReason('');
                }}
                className="btn-secondary"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                className="btn-danger"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminHolidayModal
        isOpen={showAdminHolidayModal}
        onClose={() => setShowAdminHolidayModal(false)}
        onSuccess={fetchRequests}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <div key={request.id} className="card">
            <div className="card-body">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{request.user.name}</h3>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                  {request.isAdminCreated && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Admin Created
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(request.status)}
                  <span className={`badge ${getStatusBadge(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    {format(parseISO(request.startDate), 'MMM dd')} - {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`badge ${getTypeColor(request.type)}`}>
                    {formatType(request.type)}
                  </span>
                </div>
                {request.reason && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>Reason:</strong> {request.reason}
                  </div>
                )}
              </div>

              {request.status === 'PENDING' && canApprove() && (
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="btn-success text-xs"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="btn-danger text-xs"
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                  {canDelete(request) && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {request.status !== 'PENDING' && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {request.status === 'APPROVED' && !request.isAdminCreated && 'Approved by ' + request.approver?.name}
                      {request.status === 'APPROVED' && request.isAdminCreated && 'Created by ' + request.creator?.name}
                      {request.status === 'REJECTED' && 'Rejected by ' + request.approver?.name}
                      {request.status === 'CANCELLED' && 'Cancelled by ' + request.canceller?.name}
                      <br />
                      {request.status === 'APPROVED' && request.approvedAt && format(parseISO(request.approvedAt), 'MMM dd, yyyy')}
                      {request.status === 'REJECTED' && request.approvedAt && format(parseISO(request.approvedAt), 'MMM dd, yyyy')}
                      {request.status === 'CANCELLED' && request.cancelledAt && format(parseISO(request.cancelledAt), 'MMM dd, yyyy')}
                      {request.status === 'CANCELLED' && request.cancellationReason && (
                        <div className="mt-1 text-xs text-gray-600">
                          <strong>Reason:</strong> {request.cancellationReason}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {canCancel(request) && (
                        <button
                          onClick={() => openCancelModal(request.id)}
                          className="text-orange-600 hover:text-orange-800 text-xs"
                        >
                          Cancel
                        </button>
                      )}
                      {canDelete(request) && (
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No time-off requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'No requests have been submitted yet.'
              : `No ${filter} requests found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeOff;