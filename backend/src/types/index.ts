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