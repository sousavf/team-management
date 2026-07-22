import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, TimeOffRequest } from '../types';
import { userApi, timeOffApi } from '../utils/api';
import { format, addDays, startOfWeek, isWeekend, parseISO, isWithinInterval, isToday } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DayInfo {
  date: Date;
  isWeekend: boolean;
  timeOff?: TimeOffRequest;
}

const ROLE_ORDER: Record<string, number> = {
  MANAGER: 1,
  DEVELOPER: 2,
  TESTER: 3,
  QA_MANAGER: 4,
};

const HolidayCalendar: React.FC = () => {
  const { state } = useAuth();
  const isAuthenticated = !!state.user;
  const isPrivileged =
    state.user?.role === 'ADMIN' ||
    state.user?.role === 'MANAGER' ||
    state.user?.role === 'QA_MANAGER';

  const [users, setUsers] = useState<User[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeksToShow, setWeeksToShow] = useState(4);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek, weeksToShow, isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const [usersResponse, timeOffResponse, pendingResponse] = await Promise.all([
          userApi.getUsers(),
          timeOffApi.getCalendarRequests({}),
          timeOffApi.getPendingCount(),
        ]);
        setUsers(sortMembers(usersResponse.data));
        setTimeOffRequests(timeOffResponse.data);
        setPendingRequests(pendingResponse.data.count);
      } else {
        const [usersResponse, timeOffResponse] = await Promise.all([
          userApi.getPublicUsers(),
          timeOffApi.getPublicCalendarRequests({}),
        ]);
        setUsers(sortMembers(usersResponse.data));
        setTimeOffRequests(timeOffResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load the calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sortMembers = (list: User[]): User[] =>
    list
      .filter((user) => user.role !== 'ADMIN' && user.role !== 'VIEW_ONLY')
      .sort((a, b) => {
        if (a.role !== b.role) {
          return (ROLE_ORDER[a.role] || 999) - (ROLE_ORDER[b.role] || 999);
        }
        return a.name.localeCompare(b.name);
      });

  const generateDateRange = (): Date[] => {
    const dates: Date[] = [];
    const endDate = addDays(currentWeek, weeksToShow * 7 - 1);
    for (let date = new Date(currentWeek); date <= endDate; date = addDays(date, 1)) {
      dates.push(new Date(date));
    }
    return dates;
  };

  const getDayInfo = (user: User, date: Date): DayInfo => {
    const dayInfo: DayInfo = { date, isWeekend: isWeekend(date) };

    const timeOff = timeOffRequests.find((request) => {
      if (request.userId !== user.id || request.status !== 'APPROVED') {
        return false;
      }
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const start = parseISO(request.startDate);
      const end = parseISO(request.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return isWithinInterval(checkDate, { start, end });
    });

    if (timeOff) {
      dayInfo.timeOff = timeOff;
    }
    return dayInfo;
  };

  const getSquareTooltip = (user: User, dayInfo: DayInfo): string => {
    const dateStr = format(dayInfo.date, 'MMM dd, yyyy');
    if (dayInfo.timeOff) {
      // Leave type is only visible to admins; everyone else just sees "Away".
      const detail =
        state.user?.role === 'ADMIN' && dayInfo.timeOff.type
          ? dayInfo.timeOff.type.replace('_', ' ')
          : 'Away';
      return `${user.name} — ${detail} (${dateStr})`;
    }
    if (dayInfo.isWeekend) {
      return `${user.name} — Weekend (${dateStr})`;
    }
    return `${user.name} — Working day (${dateStr})`;
  };

  const goToPreviousWeek = () => setCurrentWeek(addDays(currentWeek, -7));
  const goToNextWeek = () => setCurrentWeek(addDays(currentWeek, 7));
  const goToCurrentWeek = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const dates = generateDateRange();

  // How many people are away today — the headline the calendar exists to answer.
  const awayToday = users.filter((user) => getDayInfo(user, new Date()).timeOff).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absence Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length > 0 && (
              <>
                <span className="font-medium text-gray-700">{awayToday}</span> of{' '}
                <span className="font-medium text-gray-700">{users.length}</span> away today ·{' '}
              </>
            )}
            {format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, weeksToShow * 7 - 1), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={weeksToShow}
            onChange={(e) => setWeeksToShow(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            aria-label="Weeks to show"
          >
            <option value={2}>2 weeks</option>
            <option value={4}>4 weeks</option>
            <option value={6}>6 weeks</option>
            <option value={8}>8 weeks</option>
          </select>
          <button
            onClick={goToPreviousWeek}
            className="btn-secondary px-2.5"
            aria-label="Previous week"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button onClick={goToCurrentWeek} className="btn-secondary">
            Today
          </button>
          <button onClick={goToNextWeek} className="btn-secondary px-2.5" aria-label="Next week">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Public viewing hint */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          You're viewing the team's availability publicly.{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2">
            Sign in
          </Link>{' '}
          to request or manage time off.
        </div>
      )}

      {/* Pending requests (managers only) */}
      {isPrivileged && (
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-away-100 text-away-600 font-bold">
              {pendingRequests}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pending requests</div>
              <div className="text-sm text-gray-700">Awaiting your review</div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="card">
        <div className="card-body overflow-x-auto">
          <div className="min-w-max">
            {/* Date header */}
            <div className="flex">
              <div className="w-44 flex-shrink-0" />
              <div className="flex gap-1">
                {dates.map((date, index) => {
                  const showMonth = index === 0 || format(date, 'dd') === '01';
                  return (
                    <div key={index} className="w-8 text-center">
                      <div className="h-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {showMonth ? format(date, 'MMM') : ''}
                      </div>
                      <div
                        className={`mt-0.5 rounded-md py-1 text-xs ${
                          isToday(date)
                            ? 'bg-primary-100 font-bold text-primary-700'
                            : isWeekend(date)
                            ? 'text-gray-300'
                            : 'text-gray-500'
                        }`}
                      >
                        <div className="font-semibold leading-none">{format(date, 'd')}</div>
                        <div className="text-[10px] leading-none">{format(date, 'EEEEE')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Member rows */}
            <div className="mt-3 space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center rounded-lg py-1 hover:bg-gray-50"
                >
                  <div className="w-44 flex-shrink-0 pr-3">
                    <div className="truncate text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {dates.map((date, index) => {
                      const dayInfo = getDayInfo(user, date);
                      const away = !!dayInfo.timeOff;
                      const base =
                        'h-8 w-8 rounded-md border transition-colors';
                      const style = away
                        ? 'bg-away-400 border-away-500'
                        : dayInfo.isWeekend
                        ? 'bg-gray-100 border-gray-200'
                        : 'bg-white border-gray-200 hover:border-gray-300';
                      const todayRing = isToday(date) ? ' ring-2 ring-primary-400 ring-offset-1' : '';
                      return (
                        <div
                          key={index}
                          className={`${base} ${style}${todayRing}`}
                          title={getSquareTooltip(user, dayInfo)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">
                  No team members to show yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-gray-200 bg-white" /> Working day
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-gray-200 bg-gray-100" /> Weekend
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-away-500 bg-away-400" /> Away
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded ring-2 ring-primary-400" /> Today
        </span>
      </div>
    </div>
  );
};

export default HolidayCalendar;
