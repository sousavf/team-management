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
import { User } from '../types';
import { timeOffApi, userApi } from '../utils/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AdminHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminHolidayModal: React.FC<AdminHolidayModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'VACATION' as const,
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers();
      // Filter out admin users
      const nonAdminUsers = response.data.filter((user: User) => user.role !== 'ADMIN');
      setUsers(nonAdminUsers);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      setLoading(true);
      const response = await timeOffApi.createAdminHoliday({
        userIds: selectedUserIds,
        ...formData
      });
      toast.success(response.data.message);
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      startDate: '',
      endDate: '',
      type: 'VACATION',
      reason: '',
    });
    setSelectedUserIds([]);
    setSelectAll(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Create Team Holiday</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="label">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="input"
              rows={3}
              placeholder="e.g., Company holiday, Training day, etc."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label">Select Users</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserSelection(user.id)}
                    className="form-checkbox"
                  />
                  <span className="text-sm">
                    {user.name} ({user.role})
                  </span>
                </label>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {selectedUserIds.length} of {users.length} users selected
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminHolidayModal;