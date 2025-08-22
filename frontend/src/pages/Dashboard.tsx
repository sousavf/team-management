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
import { TeamCapacityOverview, TodoCapacityAggregation } from '../types';
import { capacityApi, timeOffApi } from '../utils/api';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { ChevronDownIcon, DocumentArrowDownIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [teamOverview, setTeamOverview] = useState<TeamCapacityOverview[]>([]);
  const [todoCapacity, setTodoCapacity] = useState<TodoCapacityAggregation | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartWeek, setExportStartWeek] = useState(format(subWeeks(new Date(), 12), 'yyyy-MM-dd'));
  const [exportEndWeek, setExportEndWeek] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportIncludeNotes, setExportIncludeNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const [overviewResponse, todoResponse, timeOffResponse] = await Promise.all([
        capacityApi.getTeamOverview({
          weekStart: format(currentWeek, 'yyyy-MM-dd'),
          weeks: 4
        }),
        capacityApi.getTodoCapacity(),
        timeOffApi.getPendingCount()
      ]);

      setTeamOverview(overviewResponse.data);
      setTodoCapacity(todoResponse.data);
      setPendingRequests(timeOffResponse.data.count);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const filterOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'development', label: 'Development (Backend + Frontend)' },
    { value: 'backendDevelopment', label: 'Backend Development' },
    { value: 'frontendDevelopment', label: 'Frontend Development' },
    { value: 'codeReview', label: 'Code Review' },
    { value: 'releaseManagement', label: 'Release Management' },
    { value: 'ux', label: 'UX' },
    { value: 'technicalAnalysis', label: 'Technical Analysis' },
    { value: 'devSupport', label: 'Prod Support' }
  ];

  const getFilteredData = (weekData: TeamCapacityOverview) => {
    if (categoryFilter === 'all') {
      return weekData;
    }
    
    if (categoryFilter === 'development') {
      const developmentCapacity = weekData.categoryBreakdown.backendDevelopment + weekData.categoryBreakdown.frontendDevelopment;
      return {
        ...weekData,
        allocatedCapacity: developmentCapacity,
        categoryBreakdown: {
          ...weekData.categoryBreakdown,
          backendDevelopment: weekData.categoryBreakdown.backendDevelopment,
          frontendDevelopment: weekData.categoryBreakdown.frontendDevelopment
        }
      };
    }
    
    const categoryValue = weekData.categoryBreakdown[categoryFilter as keyof typeof weekData.categoryBreakdown];
    return {
      ...weekData,
      allocatedCapacity: categoryValue,
      categoryBreakdown: {
        ...weekData.categoryBreakdown,
        [categoryFilter]: categoryValue
      }
    };
  };

  const currentWeekData = teamOverview[0];
  const capacityData = teamOverview.map(week => {
    const filteredWeek = getFilteredData(week);
    return {
      week: format(new Date(week.weekStart), 'MMM dd'),
      utilization: Math.round((filteredWeek.allocatedCapacity / week.totalCapacity) * 100),
      availability: Math.round((week.totalCapacity / week.theoreticalMaxCapacity) * 100),
      effectiveUtilization: Math.round((filteredWeek.allocatedCapacity / week.theoreticalMaxCapacity) * 100),
      allocated: Math.round(filteredWeek.allocatedCapacity),
      available: Math.round(week.totalCapacity),
      theoretical: Math.round(week.theoreticalMaxCapacity)
    };
  });

  const exportToExcel = () => {
    const exportData = teamOverview.map(week => {
      const filteredWeek = getFilteredData(week);
      return {
        'Week Starting': format(new Date(week.weekStart), 'MMM dd, yyyy'),
        'Max Capacity (h)': Math.round(week.theoreticalMaxCapacity),
        'Available Capacity (h)': Math.round(week.totalCapacity),
        'Allocated Capacity (h)': Math.round(filteredWeek.allocatedCapacity),
        'Availability (%)': Math.round((week.totalCapacity / week.theoreticalMaxCapacity) * 100),
        'Utilization (%)': Math.round((filteredWeek.allocatedCapacity / week.theoreticalMaxCapacity) * 100),
        'Team Members': week.totalTeamMembers,
        'Allocated Members': week.allocatedMembers,
        ...(categoryFilter === 'all' && {
          'Backend Development (h)': Math.round(week.categoryBreakdown.backendDevelopment),
          'Frontend Development (h)': Math.round(week.categoryBreakdown.frontendDevelopment),
          'Code Review (h)': Math.round(week.categoryBreakdown.codeReview),
          'Release Management (h)': Math.round(week.categoryBreakdown.releaseManagement),
          'UX (h)': Math.round(week.categoryBreakdown.ux),
          'Technical Analysis (h)': Math.round(week.categoryBreakdown.technicalAnalysis),
          'Prod Support (h)': Math.round(week.categoryBreakdown.devSupport)
        })
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Overview');
    
    const filterLabel = filterOptions.find(opt => opt.value === categoryFilter)?.label || 'All Categories';
    const fileName = `team-capacity-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    toast.success('Excel file exported successfully!');
  };

  const canExport = () => {
    return ['ADMIN', 'MANAGER', 'VIEW_ONLY'].includes(state.user?.role || '');
  };

  const handleHistoricalExport = async () => {
    try {
      setIsExporting(true);
      const response = await capacityApi.exportToExcel({
        startWeek: exportStartWeek,
        endWeek: exportEndWeek,
        includeNotes: exportIncludeNotes
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `team-capacity-historical-${exportStartWeek}-to-${exportEndWeek}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Historical data exported successfully!');
      setShowExportModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export historical data');
    } finally {
      setIsExporting(false);
    }
  };

  const categoryData = currentWeekData ? (() => {
    if (categoryFilter === 'all') {
      return Object.entries(currentWeekData.categoryBreakdown).map(([key, value], index) => ({
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: Math.round(value),
        fill: colors[index % colors.length]
      }));
    } else if (categoryFilter === 'development') {
      return [
        {
          name: 'Backend Development',
          value: Math.round(currentWeekData.categoryBreakdown.backendDevelopment),
          fill: colors[0]
        },
        {
          name: 'Frontend Development',
          value: Math.round(currentWeekData.categoryBreakdown.frontendDevelopment),
          fill: colors[1]
        }
      ];
    } else {
      const categoryValue = currentWeekData.categoryBreakdown[categoryFilter as keyof typeof currentWeekData.categoryBreakdown];
      return [{
        name: filterOptions.find(opt => opt.value === categoryFilter)?.label || categoryFilter,
        value: Math.round(categoryValue),
        fill: colors[0]
      }];
    }
  })() : [];

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
        <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
        {state.user && (
          <div className="text-sm text-gray-500">
            Welcome back, {state.user.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Team</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentWeekData?.totalTeamMembers || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Allocated</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentWeekData?.allocatedMembers || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">%</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Availability</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentWeekData ? Math.round((currentWeekData.totalCapacity / currentWeekData.theoreticalMaxCapacity) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">
                  {currentWeekData ? Math.round((currentWeekData.allocatedCapacity / currentWeekData.theoreticalMaxCapacity) * 100) : 0}% utilized
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pending Requests</div>
                <div className="text-2xl font-bold text-gray-900">
                  {pendingRequests}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Team Capacity Trends</h3>
            <p className="text-sm text-gray-600 mt-1">
              Blue: Team availability (% of max capacity available after holidays/time off)<br/>
              Green: Effective utilization (% of max capacity actually used)
            </p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}%`,
                    name === 'availability' ? 'Team Availability' : 'Effective Utilization'
                  ]}
                />
                <Bar dataKey="availability" fill="#3B82F6" name="availability" />
                <Bar dataKey="effectiveUtilization" fill="#10B981" name="effectiveUtilization" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Current Week Allocation
              {categoryFilter !== 'all' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({filterOptions.find(opt => opt.value === categoryFilter)?.label})
                </span>
              )}
            </h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {todoCapacity && todoCapacity.todoCapacities.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Current Week TODO Priorities 
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Week of {format(new Date(todoCapacity.weekStart), 'MMM dd, yyyy')})
              </span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Development capacity allocation by TODO priority (Backend + Frontend hours only)
            </p>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-left">TODO Priority</th>
                    <th className="text-center">Backend Hours</th>
                    <th className="text-center">Frontend Hours</th>
                    <th className="text-center">Total Dev Hours</th>
                    <th className="text-center">Developers</th>
                    <th className="text-left">Team Members</th>
                  </tr>
                </thead>
                <tbody>
                  {todoCapacity.todoCapacities.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="font-medium text-gray-900">
                        <div className="max-w-xs">
                          <div className="truncate" title={item.priority}>
                            {item.priority}
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="text-blue-600 font-medium">
                          {Math.round(item.backendHours)}h
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="text-green-600 font-medium">
                          {Math.round(item.frontendHours)}h
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="text-gray-900 font-bold">
                          {Math.round(item.totalHours)}h
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-primary">
                          {item.userCount}
                        </span>
                      </td>
                      <td className="text-left">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-600 truncate" title={item.users.join(', ')}>
                            {item.users.join(', ')}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-medium">
                    <td className="text-gray-900">Total</td>
                    <td className="text-center text-blue-600">
                      {Math.round(todoCapacity.todoCapacities.reduce((sum, item) => sum + item.backendHours, 0))}h
                    </td>
                    <td className="text-center text-green-600">
                      {Math.round(todoCapacity.todoCapacities.reduce((sum, item) => sum + item.frontendHours, 0))}h
                    </td>
                    <td className="text-center text-gray-900 font-bold">
                      {Math.round(todoCapacity.todoCapacities.reduce((sum, item) => sum + item.totalHours, 0))}h
                    </td>
                    <td className="text-center">
                      {todoCapacity.todoCapacities.reduce((sum, item) => sum + item.userCount, 0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Weekly Overview</h3>
            <div className="flex space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {filterOptions.find(opt => opt.value === categoryFilter)?.label}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setCategoryFilter(option.value);
                            setShowFilterDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            categoryFilter === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                Export Current
              </button>
              {canExport() && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ClockIcon className="mr-2 h-4 w-4" />
                  Export Historical
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Max Capacity</th>
                  <th>Available</th>
                  <th>Allocated</th>
                  <th>Availability</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {teamOverview.map((week, index) => {
                  const filteredWeek = getFilteredData(week);
                  return (
                    <tr key={index}>
                      <td className="font-medium">
                        {format(new Date(week.weekStart), 'MMM dd, yyyy')}
                      </td>
                      <td>{Math.round(week.theoreticalMaxCapacity)}h</td>
                      <td>{Math.round(week.totalCapacity)}h</td>
                      <td>{Math.round(filteredWeek.allocatedCapacity)}h</td>
                      <td>
                        <span className={`badge ${
                          (week.totalCapacity / week.theoreticalMaxCapacity) > 0.9 
                            ? 'badge-success' 
                            : (week.totalCapacity / week.theoreticalMaxCapacity) > 0.7 
                              ? 'badge-warning' 
                              : 'badge-danger'
                        }`}>
                          {Math.round((week.totalCapacity / week.theoreticalMaxCapacity) * 100)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          (filteredWeek.allocatedCapacity / week.theoreticalMaxCapacity) > 0.6 
                            ? 'badge-success' 
                            : (filteredWeek.allocatedCapacity / week.theoreticalMaxCapacity) > 0.3 
                              ? 'badge-warning' 
                              : 'badge-danger'
                        }`}>
                          {Math.round((filteredWeek.allocatedCapacity / week.theoreticalMaxCapacity) * 100)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showFilterDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFilterDropdown(false)}
        />
      )}

      {/* Historical Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Export Historical Capacity Data
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Week
                  </label>
                  <input
                    type="date"
                    value={exportStartWeek}
                    onChange={(e) => setExportStartWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Week
                  </label>
                  <input
                    type="date"
                    value={exportEndWeek}
                    onChange={(e) => setExportEndWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeNotes"
                    checked={exportIncludeNotes}
                    onChange={(e) => setExportIncludeNotes(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeNotes" className="ml-2 block text-sm text-gray-900">
                    Include weekly priorities/notes
                  </label>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <p><strong>Historical export includes:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Summary sheet with overall statistics</li>
                    <li>Detailed allocations for all team members</li>
                    <li>Working days and capacity calculations</li>
                    <li>Category breakdown by percentage and hours</li>
                    {exportIncludeNotes && <li>Weekly priorities and notes</li>}
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">
                    This provides detailed individual allocation data, different from the dashboard overview.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleHistoricalExport}
                  disabled={isExporting || !exportStartWeek || !exportEndWeek}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export Historical Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;