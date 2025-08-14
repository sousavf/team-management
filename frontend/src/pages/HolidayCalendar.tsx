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
import { User, TimeOffRequest } from '../types';
import { userApi, timeOffApi } from '../utils/api';
import { format, addDays, startOfWeek, endOfWeek, isWeekend, parseISO, isWithinInterval, isToday } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DayInfo {
  date: Date;
  isWeekend: boolean;
  timeOff?: TimeOffRequest;
}

const HolidayCalendar: React.FC = () => {
  const { state } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeksToShow, setWeeksToShow] = useState(4);

  useEffect(() => {
    fetchData();
  }, [currentWeek, weeksToShow]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, timeOffResponse] = await Promise.all([
        userApi.getUsers(),
        timeOffApi.getCalendarRequests({})
      ]);

      // Filter out admin and view-only users (but include managers, developers, and testers)
      const developers = usersResponse.data.filter((user: User) => 
        user.role !== 'ADMIN' && user.role !== 'VIEW_ONLY'
      ).sort((a: User, b: User) => {
        // First sort by role
        if (a.role !== b.role) {
          const roleOrder = { 'MANAGER': 1, 'DEVELOPER': 2, 'TESTER': 3, 'QA_MANAGER': 4 };
          return (roleOrder[a.role as keyof typeof roleOrder] || 999) - (roleOrder[b.role as keyof typeof roleOrder] || 999);
        }
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      setUsers(developers);
      setTimeOffRequests(timeOffResponse.data);
    } catch (error) {
      toast.error('Failed to load holiday calendar data');
    } finally {
      setLoading(false);
    }
  };

  const generateDateRange = () => {
    const dates: Date[] = [];
    const endDate = addDays(currentWeek, weeksToShow * 7 - 1);
    
    for (let date = new Date(currentWeek); date <= endDate; date = addDays(date, 1)) {
      dates.push(new Date(date));
    }
    
    return dates;
  };

  const getDayInfo = (user: User, date: Date): DayInfo => {
    const dayInfo: DayInfo = {
      date,
      isWeekend: isWeekend(date),
    };

    // Find time-off request for this user and date
    const timeOff = timeOffRequests.find(request => {
      if (request.userId !== user.id || request.status !== 'APPROVED') {
        return false;
      }
      
      // Parse dates and normalize to avoid timezone issues
      const startDate = parseISO(request.startDate);
      const endDate = parseISO(request.endDate);
      
      // Normalize the check date to midnight for consistent comparison
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Normalize start and end dates to midnight
      const normalizedStart = new Date(startDate);
      const normalizedEnd = new Date(endDate);
      normalizedStart.setHours(0, 0, 0, 0);
      normalizedEnd.setHours(0, 0, 0, 0);
      
      return isWithinInterval(checkDate, {
        start: normalizedStart,
        end: normalizedEnd
      });
    });

    if (timeOff) {
      dayInfo.timeOff = timeOff;
    }

    return dayInfo;
  };

  const getSquareColor = (dayInfo: DayInfo): string => {
    if (dayInfo.timeOff) {
      return 'bg-blue-400';
    }
    
    if (dayInfo.isWeekend) {
      return 'bg-gray-200';
    }
    
    return 'bg-white border-gray-300';
  };

  const getSquareTooltip = (user: User, dayInfo: DayInfo): string => {
    const dateStr = format(dayInfo.date, 'MMM dd, yyyy');
    
    if (dayInfo.timeOff) {
      return `${user.name} - ${dayInfo.timeOff.type?.replace('_', ' ') || 'Time Off'} (${dateStr})`;
    }
    
    if (dayInfo.isWeekend) {
      return `${user.name} - Weekend (${dateStr})`;
    }
    
    return `${user.name} - Working day (${dateStr})`;
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const dates = generateDateRange();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absence Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">
            Team availability overview - {format(currentWeek, 'MMM dd')} to {format(addDays(currentWeek, weeksToShow * 7 - 1), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Weeks:</label>
            <select
              value={weeksToShow}
              onChange={(e) => setWeeksToShow(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={2}>2 weeks</option>
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
            </select>
          </div>
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToCurrentWeek}
            className="btn-primary text-sm px-3 py-1"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body overflow-x-auto">
          <div className="min-w-full">
            {/* Header row with dates */}
            <div className="flex mb-4">
              <div className="w-40 flex-shrink-0 font-medium text-gray-700 py-2">
                Developer
              </div>
              <div className="flex space-x-1">
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-medium ${
                      isToday(date) 
                        ? 'bg-yellow-100 text-yellow-800 rounded-md' 
                        : isWeekend(date) 
                        ? 'text-gray-400' 
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div>{format(date, 'd')}</div>
                      <div className="text-xs">{format(date, 'E')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Month labels */}
            <div className="flex mb-2">
              <div className="w-40 flex-shrink-0"></div>
              <div className="flex space-x-1">
                {dates.map((date, index) => {
                  const showMonth = index === 0 || format(date, 'dd') === '01';
                  return (
                    <div key={index} className={`w-8 h-4 flex items-center justify-center ${isToday(date) ? 'bg-yellow-100 rounded-md' : ''}`}>
                      {showMonth && (
                        <div className={`text-xs font-medium ${isToday(date) ? 'text-yellow-800' : 'text-gray-500'}`}>
                          {format(date, 'MMM')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Developer rows */}
            {users.map((user) => (
              <div key={user.id} className="flex items-center mb-2">
                <div className="w-40 flex-shrink-0 font-medium text-gray-900 py-2">
                  {user.name}
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <div className="flex space-x-1">
                  {dates.map((date, index) => {
                    const dayInfo = getDayInfo(user, date);
                    const squareColor = getSquareColor(dayInfo);
                    const tooltip = getSquareTooltip(user, dayInfo);
                    
                    return (
                      <div
                        key={index}
                        className={`w-8 h-8 border rounded ${squareColor} cursor-pointer hover:opacity-80 transition-opacity ${
                          isToday(date) ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''
                        }`}
                        {...(state.user?.role === 'ADMIN' || state.user?.role === 'MANAGER' ? { title: tooltip } : {})}
                      >
                        {dayInfo.timeOff && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Legend</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
              <span className="text-sm">Working Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <span className="text-sm">Weekend</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-400 rounded"></div>
              <span className="text-sm">Absent</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Each square represents one day for a developer</p>
            <p>• Hover over squares to see detailed information</p>
            <p>• White dots indicate approved time-off requests</p>
            <p>• Only approved time-off requests are shown</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar;