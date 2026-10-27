import type { AppData, Decision } from '../types';
import { time } from './format';

export function getDecisionDisplay(data: AppData, decision: Decision) {
  const shift = data.shifts.find((item) => item.id === decision.plan.shiftId);
  const originalCaregiver = data.caregivers.find(
    (item) => item.id === decision.originalCaregiverId,
  );
  const assignedCaregiver = data.caregivers.find(
    (item) => item.id === decision.plan.caregiverId,
  );

  return {
    caseLabel: shift ? `個案 ${shift.clientId}` : decision.plan.shiftId,
    shiftLabel: decision.plan.shiftId,
    serviceTime: `${time(decision.plan.start)}–${time(decision.plan.end)}`,
    originalCaregiver:
      originalCaregiver?.name || decision.originalCaregiverId || '未指定',
    assignedCaregiver:
      assignedCaregiver?.name || decision.plan.caregiverId || '未指定',
  };
}
