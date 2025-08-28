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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEW_ONLY' | 'TESTER' | 'QA_MANAGER';
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  userId: string;
  weekStart: string;
  backendDevelopment: number;
  frontendDevelopment: number;
  codeReview: number;
  releaseManagement: number;
  ux: number;
  technicalAnalysis: number;
  devSupport: number;
  weeklyPriority?: string;
  totalAllocation: number;
  maxHours: number;
  allocatedHours: number;
  availableHours: number;
  workingDays: number;
  maxWorkingDays: number;
  weekStartFormatted: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'OTHER';
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isAdminCreated: boolean;
  createdBy?: string;
  user: User;
  approver?: User;
  canceller?: User;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TeamCapacityOverview {
  weekStart: string;
  totalTeamMembers: number;
  allocatedMembers: number;
  totalCapacity: number;
  theoreticalMaxCapacity: number;
  allocatedCapacity: number;
  categoryBreakdown: {
    backendDevelopment: number;
    frontendDevelopment: number;
    codeReview: number;
    releaseManagement: number;
    ux: number;
    technicalAnalysis: number;
    devSupport: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AllocationUpdate {
  backendDevelopment: number;
  frontendDevelopment: number;
  codeReview: number;
  releaseManagement: number;
  ux: number;
  technicalAnalysis: number;
  devSupport: number;
  weeklyPriority?: string;
}

export interface TimeOffRequestCreate {
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'OTHER';
  reason?: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  url: string;
  issueType: string;
  sprint: string;
}

export interface UserJiraTickets {
  userId: string;
  name: string;
  email: string;
  tickets: JiraTicket[];
}

export interface JiraTicketsResponse {
  enabled: boolean;
  message?: string;
  userTickets: UserJiraTickets[];
}

export interface TodoCapacityItem {
  priority: string;
  backendHours: number;
  frontendHours: number;
  codeReviewHours: number;
  releaseManagementHours: number;
  devSupportHours: number;
  technicalAnalysisHours: number;
  totalHours: number;
  userCount: number;
  users: string[];
}

export interface TodoCapacityAggregation {
  weekStart: string;
  totalAllocations: number;
  todoCapacities: TodoCapacityItem[];
}