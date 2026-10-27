export type Tone = 'normal' | 'urgent' | 'flexible';
export interface Shift {
  id: string;
  clientId: string;
  district: string;
  start: number;
  end: number;
  maxDelay: number;
  skills: string[];
  femaleRequired: boolean;
  critical: boolean;
  familiarIds: string[];
  caregiverId: string;
  status: 'scheduled' | 'pending' | 'assigned' | 'completed' | 'cancelled';
  weekday?: number;
  clientName?: string;
  address?: string;
  serviceItems?: string;
}
export interface Caregiver {
  id: string;
  name: string;
  female: boolean;
  skills: string[];
  available: boolean;
  workMinutes: number;
  maxMinutes: number;
  recentRescues: number;
  district?: string;
  transport?: string;
  address?: string;
  ageGroup?: string;
  qualifications?: string[];
}
export interface Client {
  id: string;
  name: string;
  sex: string;
  age: number | null;
  district: string;
  address: string;
  careLevel?: string;
  disabilityLevel?: string;
}
export interface LeaveRequest {
  id: string;
  createdAt: string;
  caregiverId: string;
  date: string;
  endDate?: string;
  start: number;
  end: number;
  type: string;
  reason: string;
  urgent: boolean;
  status: 'pending' | 'approved' | 'rejected';
}
export interface StopRecord {
  id: string;
  shiftId: string;
  clientId: string;
  originalCaregiverId: string;
  originalStart: number;
  originalEnd: number;
  contactName: string;
  contactMethod: 'phone' | 'line' | 'in_person' | 'other';
  reason: string;
  note?: string;
  operator: string;
  createdAt: string;
}
export interface PairingExclusion {
  id: string;
  clientId: string;
  caregiverId: string;
  requestedBy: 'client' | 'caregiver';
  reason: string;
  operator: string;
  createdAt: string;
}
export interface EventRecord {
  id: string;
  type: 'leave' | 'delay' | 'stop' | 'hospital' | 'change';
  caregiverId?: string;
  shiftId?: string;
  delayMinutes: number;
  reason: string;
  createdAt: string;
  affectedIds: string[];
  stopRecordId?: string;
  updates?: Partial<Pick<Shift, 'start' | 'end' | 'maxDelay' | 'skills' | 'femaleRequired' | 'critical'>>;
}
export interface Plan {
  id: string;
  shiftId: string;
  caregiverId: string;
  title: string;
  start: number;
  end: number;
  travel: number;
  familiar: boolean;
  risk: 'low' | 'medium' | 'high';
  tradeOff: string;
  summary: string;
  score: number;
}
export interface Decision {
  id: string;
  plan: Plan;
  action: 'accept' | 'modify' | 'reject';
  reason: string;
  operator: string;
  createdAt: string;
  originalCaregiverId: string;
  originalStart: number;
}
export interface Notification {
  id: string;
  decisionId: string;
  recipient: string;
  status: 'pending' | 'sent' | 'replied' | 'failed';
  channel?: 'app' | 'sms';
  createdAt?: string;
  sentAt?: string;
  repliedAt?: string;
  attempts?: number;
}
export interface AppData {
  version: 2;
  shifts: Shift[];
  weeklyShifts?: Shift[];
  caregivers: Caregiver[];
  clients: Client[];
  events: EventRecord[];
  decisions: Decision[];
  notifications: Notification[];
  leaveRequests: LeaveRequest[];
  stopRecords: StopRecord[];
  pairingExclusions: PairingExclusion[];
}
