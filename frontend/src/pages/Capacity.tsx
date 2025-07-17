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
import { Allocation, User, AllocationUpdate } from '../types';
import { capacityApi, userApi } from '../utils/api';
import { format, startOfWeek, addWeeks, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const Capacity: React.FC = () => {
  const { state } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<AllocationUpdate>({
    backendDevelopment: 0,
    frontendDevelopment: 0,
    codeReview: 0,
    releaseManagement: 0,
    ux: 0,
    technicalAnalysis: 0,
    devSupport: 0,
    weeklyPriority: '',
  });
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeks] = useState(4);
  const [copyingWeek, setCopyingWeek] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentWeek, weeks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocationsResponse, usersResponse] = await Promise.all([
        capacityApi.getAllocations({
          weekStart: format(currentWeek, 'yyyy-MM-dd'),
          weeks
        }),
        userApi.getUsers()
      ]);

      setAllocations(allocationsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      toast.error('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  };

  const getAllocation = (userId: string, weekStart: string) => {
    return allocations.find(a => a.userId === userId && a.weekStartFormatted === weekStart);
  };

  const canEdit = () => {
    return ['ADMIN', 'MANAGER'].includes(state.user?.role || '');
  };

  const startEditing = (userId: string, weekStart: string) => {
    const allocation = getAllocation(userId, weekStart);
    if (allocation) {
      setEditValues({
        backendDevelopment: allocation.backendDevelopment,
        frontendDevelopment: allocation.frontendDevelopment,
        codeReview: allocation.codeReview,
        releaseManagement: allocation.releaseManagement,
        ux: allocation.ux,
        technicalAnalysis: allocation.technicalAnalysis,
        devSupport: allocation.devSupport,
        weeklyPriority: allocation.weeklyPriority || '',
      });
    } else {
      setEditValues({
        backendDevelopment: 0,
        frontendDevelopment: 0,
        codeReview: 0,
        releaseManagement: 0,
        ux: 0,
        technicalAnalysis: 0,
        devSupport: 0,
        weeklyPriority: '',
      });
    }
    setEditingCell(`${userId}-${weekStart}`);
  };

  const saveAllocation = async (userId: string, weekStart: string) => {
    try {
      const total = editValues.backendDevelopment + editValues.frontendDevelopment + 
                    editValues.codeReview + editValues.releaseManagement + 
                    editValues.ux + editValues.technicalAnalysis + editValues.devSupport;
      if (total > 100) {
        toast.error('Total allocation cannot exceed 100%');
        return;
      }

      await capacityApi.updateAllocation(userId, weekStart, editValues);
      toast.success('Allocation updated successfully');
      setEditingCell(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update allocation');
    }
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValues({
      backendDevelopment: 0,
      frontendDevelopment: 0,
      codeReview: 0,
      releaseManagement: 0,
      ux: 0,
      technicalAnalysis: 0,
      devSupport: 0,
      weeklyPriority: '',
    });
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < weeks; i++) {
      dates.push(addWeeks(currentWeek, i));
    }
    return dates;
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const copyFromPreviousWeek = async (weekStart: string) => {
    try {
      setCopyingWeek(weekStart);
      const response = await capacityApi.copyFromPreviousWeek(weekStart);
      toast.success(response.data.message);
      fetchData(); // Refresh the data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to copy from previous week');
    } finally {
      setCopyingWeek(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Capacity Management</h1>
          {canEdit() && (
            <p className="text-sm text-gray-600 mt-1">
              💡 Tip: Use "Copy Previous" buttons in week columns to quickly copy allocations from the previous week
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousWeek}
            className="btn-secondary"
          >
            Previous Week
          </button>
          <button
            onClick={goToCurrentWeek}
            className="btn-primary"
          >
            Current Week
          </button>
          <button
            onClick={goToNextWeek}
            className="btn-secondary"
          >
            Next Week
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Weekly Allocations: {format(currentWeek, 'MMM dd')} - {format(addWeeks(currentWeek, weeks - 1), 'MMM dd, yyyy')}
          </h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10">Developer</th>
                {weekDates.map((date, index) => {
                  const weekStart = format(date, 'yyyy-MM-dd');
                  const isFirstWeek = index === 0;
                  const isCopying = copyingWeek === weekStart;
                  
                  return (
                    <th key={index} className="text-center min-w-48">
                      <div className="flex flex-col items-center space-y-1">
                        <div>
                          {format(date, 'MMM dd')}
                          <br />
                          <span className="text-xs text-gray-500">{format(date, 'yyyy')}</span>
                        </div>
                        {canEdit() && !isFirstWeek && (
                          <button
                            onClick={() => copyFromPreviousWeek(weekStart)}
                            disabled={isCopying}
                            className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${
                              isCopying 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title="Copy allocations from previous week"
                          >
                            <DocumentDuplicateIcon className="w-3 h-3" />
                            <span>{isCopying ? 'Copying...' : 'Copy Previous'}</span>
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {users.filter(user => user.role !== 'ADMIN').map((user) => {
                const isCurrentUser = state.user?.id === user.id;
                return (
                  <tr key={user.id} className={isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''}>
                    <td className={`sticky left-0 z-10 font-medium ${isCurrentUser ? 'bg-blue-50' : 'bg-white'}`}>
                      <div className="flex items-center space-x-2">
                        <div>
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">You</span>
                          )}
                          <br />
                          <span className="text-xs text-gray-500">{user.role}</span>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((date, weekIndex) => {
                      const weekStart = format(date, 'yyyy-MM-dd');
                      const allocation = getAllocation(user.id, weekStart);
                      const isEditing = editingCell === `${user.id}-${weekStart}`;
                      const totalAllocation = allocation?.totalAllocation || 0;

                      return (
                        <td key={weekIndex} className={`text-center relative ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                        {isEditing ? (
                          <div className="space-y-2 p-2 bg-gray-50 rounded">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block">Backend</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.backendDevelopment}
                                  onChange={(e) => setEditValues({...editValues, backendDevelopment: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">Frontend</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.frontendDevelopment}
                                  onChange={(e) => setEditValues({...editValues, frontendDevelopment: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">Code Rev</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.codeReview}
                                  onChange={(e) => setEditValues({...editValues, codeReview: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">Release</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.releaseManagement}
                                  onChange={(e) => setEditValues({...editValues, releaseManagement: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">UX</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.ux}
                                  onChange={(e) => setEditValues({...editValues, ux: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">Analysis</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.technicalAnalysis}
                                  onChange={(e) => setEditValues({...editValues, technicalAnalysis: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                              <div>
                                <label className="block">Prod Support</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editValues.devSupport}
                                  onChange={(e) => setEditValues({...editValues, devSupport: parseInt(e.target.value) || 0})}
                                  className="w-full px-1 py-1 border rounded text-center"
                                />
                              </div>
                            </div>
                            <div className="mt-2">
                              <label className="block text-xs mb-1">Weekly Priority (TODO)</label>
                              <input
                                type="text"
                                maxLength={50}
                                value={editValues.weeklyPriority || ''}
                                onChange={(e) => setEditValues({...editValues, weeklyPriority: e.target.value})}
                                className="w-full px-1 py-1 border rounded text-xs"
                                placeholder="e.g., Focus on API development"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {(editValues.weeklyPriority || '').length}/50 characters
                              </div>
                            </div>
                            <div className="text-xs">
                              Total: {editValues.backendDevelopment + editValues.frontendDevelopment + 
                                     editValues.codeReview + editValues.releaseManagement + 
                                     editValues.ux + editValues.technicalAnalysis}%
                            </div>
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => saveAllocation(user.id, weekStart)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group">
                            {allocation ? (
                              <div className="space-y-1">
                                <div className={`text-lg font-bold ${
                                  totalAllocation > 80 ? 'text-green-600' : 
                                  totalAllocation > 50 ? 'text-yellow-600' : 
                                  'text-red-600'
                                }`}>
                                  {totalAllocation}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {allocation.workingDays}d / {allocation.maxWorkingDays}d
                                  {allocation.workingDays < allocation.maxWorkingDays && (
                                    <div className="text-xs text-orange-600">
                                      (reduced by time off)
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs space-y-1">
                                  {allocation.backendDevelopment > 0 && (
                                    <div>Backend: {allocation.backendDevelopment}%</div>
                                  )}
                                  {allocation.frontendDevelopment > 0 && (
                                    <div>Frontend: {allocation.frontendDevelopment}%</div>
                                  )}
                                  {allocation.codeReview > 0 && (
                                    <div>Code Rev: {allocation.codeReview}%</div>
                                  )}
                                  {allocation.releaseManagement > 0 && (
                                    <div>Release: {allocation.releaseManagement}%</div>
                                  )}
                                  {allocation.ux > 0 && (
                                    <div>UX: {allocation.ux}%</div>
                                  )}
                                  {allocation.technicalAnalysis > 0 && (
                                    <div>Analysis: {allocation.technicalAnalysis}%</div>
                                  )}
                                  {allocation.devSupport > 0 && (
                                    <div>Prod Support: {allocation.devSupport}%</div>
                                  )}
                                </div>
                                {allocation.weeklyPriority && (
                                  <div className="mt-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs">
                                    <div className="font-medium text-amber-800">TODO:</div>
                                    <div className="text-amber-700">{allocation.weeklyPriority}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                <div className="text-lg">0%</div>
                                <div className="text-xs">Not allocated</div>
                              </div>
                            )}
                            {canEdit() && (
                              <button
                                onClick={() => startEditing(user.id, weekStart)}
                                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Allocation Legend</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Backend Development</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Frontend Development</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Code Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Release Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>UX Design</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Technical Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Prod Support</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Days shown are working days (Monday-Friday)</p>
            <p>• Green: &gt;80% utilization, Yellow: 50-80%, Red: &lt;50%</p>
            <p>• "Reduced by time off" indicator shows when availability is reduced due to approved time off</p>
            <p>• Click the pencil icon to edit allocations (Managers/Admins only)</p>
            <p>• Use "Copy Previous" button to copy all allocations from the previous week</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Capacity;