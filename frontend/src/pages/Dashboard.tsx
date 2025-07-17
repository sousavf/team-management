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
import { TeamCapacityOverview } from '../types';
import { capacityApi, timeOffApi } from '../utils/api';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { ChevronDownIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [teamOverview, setTeamOverview] = useState<TeamCapacityOverview[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const [overviewResponse, timeOffResponse] = await Promise.all([
        capacityApi.getTeamOverview({
          weekStart: format(currentWeek, 'yyyy-MM-dd'),
          weeks: 4
        }),
        timeOffApi.getPendingCount()
      ]);

      setTeamOverview(overviewResponse.data);
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
                Export Excel
              </button>
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
    </div>
  );
};

export default Dashboard;