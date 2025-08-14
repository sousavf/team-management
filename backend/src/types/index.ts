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

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'TESTER' | 'QA_MANAGER';
}

export interface AllocationData {
  backendDevelopment: number;
  frontendDevelopment: number;
  codeReview: number;
  releaseManagement: number;
  ux: number;
  technicalAnalysis: number;
}

export interface TimeOffRequestData {
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'OTHER';
  reason?: string;
}

export interface WeeklyCapacity {
  userId: string;
  weekStart: string;
  allocation: AllocationData;
  workingDays: number;
  totalHours: number;
  availableHours: number;
}