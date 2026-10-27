import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppData,
  EventRecord,
  Plan,
  Decision,
  Notification,
  Shift,
  Caregiver,
  LeaveRequest,
  StopRecord,
  PairingExclusion,
} from '../types';
import { createSeed } from '../data/seed';
import { generatePlans } from '../services/rescueEngine';
import { leaveAffectsShift, sameServiceDay } from '../utils/schedule';
const KEY = 'carerescue-real-v5';
function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const value = JSON.parse(raw);
      if (
        value.version === 5 &&
        Array.isArray(value.shifts) &&
        Array.isArray(value.caregivers) &&
        Array.isArray(value.events) &&
        Array.isArray(value.decisions) &&
        Array.isArray(value.notifications)
      )
        return {
          ...value,
          clients: Array.isArray(value.clients) ? value.clients : createSeed().clients,
          weeklyShifts: Array.isArray(value.weeklyShifts) ? value.weeklyShifts : createSeed().weeklyShifts,
          stopRecords: Array.isArray(value.stopRecords) ? value.stopRecords : [],
          pairingExclusions: Array.isArray(value.pairingExclusions) ? value.pairingExclusions : [],
          leaveRequests: Array.isArray(value.leaveRequests)
            ? value.leaveRequests
            : createSeed().leaveRequests,
        };
    }
  } catch {
    /* 使用新的示範資料 */
  }
  return createSeed();
}
interface Store {
  data: AppData;
  storageError: string;
  addEvent: (
    event: Omit<EventRecord, 'id' | 'createdAt' | 'affectedIds'>,
  ) => void;
  decide: (
    plan: Plan,
    action: Decision['action'],
    reason: string,
    operator: string,
  ) => void;
  notify: (id: string, status: Notification['status']) => void;
  notifyMany: (ids: string[], status: Notification['status']) => void;
  updateShift: (id: string, updates: Partial<Pick<Shift, 'start' | 'end' | 'maxDelay' | 'skills' | 'femaleRequired' | 'critical'>>) => void;
  updateCaregiver: (id: string, updates: Partial<Pick<Caregiver, 'skills' | 'available' | 'maxMinutes'>>) => void;
  completeShift: (id: string) => void;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewLeave: (id: string, status: 'approved' | 'rejected') => void;
  addCaregiver: (caregiver: Caregiver) => void;
  addShift: (shift: Shift) => void;
  manualAssign: (shiftId: string, caregiverId: string, operator: string, reason: string) => void;
  confirmClientStop: (shiftId: string, input: Pick<StopRecord, 'contactName' | 'contactMethod' | 'reason' | 'note' | 'operator'>) => void;
  addPairingExclusion: (input: Pick<PairingExclusion, 'clientId' | 'caregiverId' | 'requestedBy' | 'reason' | 'operator'>) => void;
  deletePairingExclusion: (id: string) => void;
  reset: () => void;
}
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);
  const [storageError, setStorageError] = useState('');
  function save(next: AppData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('瀏覽器無法保存資料，本次操作僅保留到重新整理前。');
    }
    setData(next);
  }
  function addEvent(
    input: Omit<EventRecord, 'id' | 'createdAt' | 'affectedIds'>,
  ) {
    const affected = data.shifts.filter(
      (s) =>
        s.status !== 'cancelled' &&
        (input.caregiverId
          ? s.caregiverId === input.caregiverId
          : s.id === input.shiftId),
    );
    if (!affected.length) throw new Error('沒有符合的班次。');
    const cancel = input.type === 'stop' || input.type === 'hospital';
    save({
      ...data,
      caregivers: data.caregivers.map((c) =>
        input.type === 'leave' && c.id === input.caregiverId
          ? { ...c, available: false }
          : c,
      ),
      shifts: data.shifts.map((s) =>
        affected.some((a) => a.id === s.id)
          ? {
              ...s,
              ...(input.type === 'change' ? input.updates : {}),
              status: cancel ? 'cancelled' : 'pending',
            }
          : s,
      ),
      events: [
        {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          affectedIds: affected.map((s) => s.id),
        },
        ...data.events,
      ],
    });
  }
  function decide(
    plan: Plan,
    action: Decision['action'],
    reason: string,
    operator: string,
  ) {
    if (!reason.trim() || !operator.trim())
      throw new Error('請填寫操作人與決策原因。');
    const shift = data.shifts.find((s) => s.id === plan.shiftId);
    if (!shift || shift.status !== 'pending')
      throw new Error('班次已處理，請重新查看。');
    const fresh = generatePlans(data, shift).plans.find(
      (p) => p.id === plan.id,
    );
    if (!fresh || fresh.start !== plan.start)
      throw new Error('方案條件已變更，請重新選擇。');
    const decision: Decision = {
      id: crypto.randomUUID(),
      plan: fresh,
      action,
      reason: reason.trim(),
      operator: operator.trim(),
      createdAt: new Date().toISOString(),
      originalCaregiverId: shift.caregiverId,
      originalStart: shift.start,
    };
    const accepted = action !== 'reject';
    const worker = data.caregivers.find((c) => c.id === plan.caregiverId)!;
    const serviceMinutes = fresh.end - fresh.start;
    const notifications: Notification[] = accepted
      ? [worker.name, `個案 ${shift.clientId} 家屬`].map((recipient) => ({
          id: crypto.randomUUID(),
          decisionId: decision.id,
          recipient,
          status: 'pending',
          channel: recipient.includes('家屬') ? 'sms' : 'app',
          createdAt: decision.createdAt,
          attempts: 0,
        }))
      : [];
    save({
      ...data,
      shifts: data.shifts.map((s) =>
        s.id === shift.id && accepted
          ? {
              ...s,
              caregiverId: fresh.caregiverId,
              start: fresh.start,
              end: fresh.end,
              status: 'assigned',
            }
          : s,
      ),
      caregivers: data.caregivers.map((c) =>
        accepted && c.id === fresh.caregiverId
          ? {
              ...c,
              workMinutes: c.workMinutes + serviceMinutes,
              recentRescues: c.recentRescues + 1,
            }
          : c,
      ),
      decisions: [decision, ...data.decisions],
      notifications: [...notifications, ...data.notifications],
    });
  }

  function addLeaveRequest(input: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) {
    if (input.end <= input.start) throw new Error('結束時間必須晚於開始時間。');
    save({
      ...data,
      leaveRequests: [{ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'pending' }, ...data.leaveRequests],
    });
  }

  function reviewLeave(id: string, status: 'approved' | 'rejected') {
    const request = data.leaveRequests.find((item) => item.id === id);
    if (!request || request.status !== 'pending') throw new Error('這筆申請已處理。');
    if (status === 'rejected') {
      save({ ...data, leaveRequests: data.leaveRequests.map((item) => item.id === id ? { ...item, status } : item) });
      return;
    }
    const sourceShifts = data.weeklyShifts || data.shifts;
    const affected = sourceShifts.filter((shift) =>
      shift.caregiverId === request.caregiverId &&
      shift.status !== 'cancelled' && shift.status !== 'completed' &&
      leaveAffectsShift(request, shift),
    );
    const affectedIds = new Set(affected.map((item) => item.id));
    const activeIds = new Set(data.shifts.map((item) => item.id));
    const newlyAffected = affected
      .filter((item) => !activeIds.has(item.id))
      .map((item) => ({ ...item, status: 'pending' as const }));
    const eventId = crypto.randomUUID();
    save({
      ...data,
      leaveRequests: data.leaveRequests.map((item) => item.id === id ? { ...item, status } : item),
      caregivers: data.caregivers.map((caregiver) => caregiver.id === request.caregiverId ? { ...caregiver, available: false } : caregiver),
      shifts: [
        ...data.shifts.map((shift) => affectedIds.has(shift.id) ? { ...shift, status: 'pending' as const } : shift),
        ...newlyAffected,
      ],
      weeklyShifts: sourceShifts.map((shift) => affectedIds.has(shift.id) ? { ...shift, status: 'pending' as const } : shift),
      events: [{ id: eventId, type: 'leave', caregiverId: request.caregiverId, delayMinutes: 0, reason: request.reason || request.type, createdAt: new Date().toISOString(), affectedIds: affected.map((item) => item.id) }, ...data.events],
    });
  }

  function addCaregiver(caregiver: Caregiver) {
    if (!caregiver.id.trim() || !caregiver.name.trim()) throw new Error('請填寫人員編號與姓名。');
    if (data.caregivers.some((item) => item.id.toLowerCase() === caregiver.id.trim().toLowerCase())) throw new Error('人員編號已存在。');
    save({ ...data, caregivers: [...data.caregivers, { ...caregiver, id: caregiver.id.trim(), name: caregiver.name.trim() }] });
  }

  function addShift(shift: Shift) {
    if (shift.end <= shift.start) throw new Error('結束時間必須晚於開始時間。');
    const conflict = data.shifts.find((item) => item.caregiverId === shift.caregiverId && item.status !== 'cancelled' && sameServiceDay(item, shift) && item.start < shift.end && item.end > shift.start);
    if (conflict) throw new Error(`班表與 ${conflict.clientId} 的服務時段重疊。`);
    if (data.shifts.some((item) => item.id === shift.id)) throw new Error('班次編號已存在。');
    save({ ...data, shifts: [...data.shifts, shift] });
  }

  function manualAssign(shiftId: string, caregiverId: string, operator: string, reason: string) {
    const shift = data.shifts.find((item) => item.id === shiftId);
    const caregiver = data.caregivers.find((item) => item.id === caregiverId);
    if (!shift || shift.status !== 'pending') throw new Error('請選擇尚未處理的班次。');
    const pairingExclusion = data.pairingExclusions.find((item) => item.clientId === shift.clientId && item.caregiverId === caregiverId);
    if (pairingExclusion) throw new Error(pairingExclusion.requestedBy === 'client' ? '此個案已排除這位照服員，無法進行人工選派。' : '這位照服員已排除此個案，無法進行人工選派。');
    if (!caregiver || !caregiver.available) throw new Error('這位照服員目前不可排班。');
    if (shift.femaleRequired && !caregiver.female) throw new Error('此班次限定女性照服員。');
    if (!shift.skills.every((skill) => caregiver.skills.includes(skill))) throw new Error('照服員不具備班次所需技能。');
    const conflict = data.shifts.find((item) => item.id !== shift.id && item.caregiverId === caregiverId && item.status !== 'cancelled' && sameServiceDay(item, shift) && item.start < shift.end && item.end > shift.start);
    if (conflict) throw new Error(`與 ${conflict.clientId} 的服務時段重疊。`);
    if (!operator.trim() || !reason.trim()) throw new Error('請填寫操作人與選派原因。');
    const plan: Plan = { id: `manual-${crypto.randomUUID()}`, shiftId, caregiverId, title: '人工選派', start: shift.start, end: shift.end, travel: 0, familiar: shift.familiarIds.includes(caregiverId), risk: 'medium', tradeOff: '由督導人工確認資格與時段', summary: reason.trim(), score: 0 };
    const decision: Decision = { id: crypto.randomUUID(), plan, action: 'modify', reason: reason.trim(), operator: operator.trim(), createdAt: new Date().toISOString(), originalCaregiverId: shift.caregiverId, originalStart: shift.start };
    const notifications: Notification[] = [caregiver.name, `個案 ${shift.clientId} 家屬`].map((recipient) => ({ id: crypto.randomUUID(), decisionId: decision.id, recipient, status: 'pending', channel: recipient.includes('家屬') ? 'sms' : 'app', createdAt: decision.createdAt, attempts: 0 }));
    save({
      ...data,
      shifts: data.shifts.map((item) => item.id === shiftId ? { ...item, caregiverId, status: 'assigned' } : item),
      caregivers: data.caregivers.map((item) => item.id === caregiverId ? { ...item, workMinutes: item.workMinutes + shift.end - shift.start, recentRescues: item.recentRescues + 1 } : item),
      decisions: [decision, ...data.decisions],
      notifications: [...notifications, ...data.notifications],
    });
  }
  function confirmClientStop(shiftId: string, input: Pick<StopRecord, 'contactName' | 'contactMethod' | 'reason' | 'note' | 'operator'>) {
    const shift = data.shifts.find((item) => item.id === shiftId);
    if (!shift || shift.status !== 'pending') throw new Error('這筆班次已處理，請重新查看。');
    if (!input.contactName.trim() || !input.reason.trim() || !input.operator.trim())
      throw new Error('請填寫確認對象與停服原因。');
    const createdAt = new Date().toISOString();
    const stopRecord: StopRecord = {
      id: crypto.randomUUID(),
      shiftId,
      clientId: shift.clientId,
      originalCaregiverId: shift.caregiverId,
      originalStart: shift.start,
      originalEnd: shift.end,
      contactName: input.contactName.trim(),
      contactMethod: input.contactMethod,
      reason: input.reason.trim(),
      note: input.note?.trim(),
      operator: input.operator.trim(),
      createdAt,
    };
    save({
      ...data,
      shifts: data.shifts.map((item) => item.id === shiftId ? { ...item, status: 'cancelled' } : item),
      stopRecords: [stopRecord, ...data.stopRecords],
      events: [{
        id: crypto.randomUUID(),
        type: 'stop',
        shiftId,
        delayMinutes: 0,
        reason: `個案同意本次停服：${stopRecord.reason}`,
        createdAt,
        affectedIds: [shiftId],
        stopRecordId: stopRecord.id,
      }, ...data.events],
    });
  }
  function addPairingExclusion(input: Pick<PairingExclusion, 'clientId' | 'caregiverId' | 'requestedBy' | 'reason' | 'operator'>) {
    if (!input.clientId || !input.caregiverId || !input.reason.trim() || !input.operator.trim())
      throw new Error('請填寫個案、照服員、排除原因與操作人。');
    if (data.pairingExclusions.some((item) => item.clientId === input.clientId && item.caregiverId === input.caregiverId))
      throw new Error('這組個案與照服員已在排除名單中。');
    save({
      ...data,
      pairingExclusions: [{ ...input, id: crypto.randomUUID(), reason: input.reason.trim(), operator: input.operator.trim(), createdAt: new Date().toISOString() }, ...data.pairingExclusions],
    });
  }
  return (
    <Context.Provider
      value={{
        data,
        storageError,
        addEvent,
        decide,
        notify: (id, status) =>
          save({
            ...data,
            notifications: data.notifications.map((n) =>
              n.id === id ? {
                ...n,
                status,
                attempts: status === 'sent' || status === 'failed' ? (n.attempts || 0) + 1 : n.attempts,
                sentAt: status === 'sent' ? new Date().toISOString() : n.sentAt,
                repliedAt: status === 'replied' ? new Date().toISOString() : n.repliedAt,
              } : n,
            ),
          }),
        notifyMany: (ids, status) =>
          save({
            ...data,
            notifications: data.notifications.map((n) => ids.includes(n.id) ? {
              ...n,
              status,
              attempts: status === 'sent' || status === 'failed' ? (n.attempts || 0) + 1 : n.attempts,
              sentAt: status === 'sent' ? new Date().toISOString() : n.sentAt,
              repliedAt: status === 'replied' ? new Date().toISOString() : n.repliedAt,
            } : n),
          }),
        updateShift: (id, updates) =>
          save({
            ...data,
            shifts: data.shifts.map((s) =>
              s.id === id ? { ...s, ...updates, status: 'pending' } : s,
            ),
          }),
        updateCaregiver: (id, updates) =>
          save({
            ...data,
            caregivers: data.caregivers.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          }),
        completeShift: (id) =>
          save({
            ...data,
            shifts: data.shifts.map((s) =>
              s.id === id && s.status === 'assigned'
                ? { ...s, status: 'completed' }
                : s,
            ),
          }),
        addLeaveRequest,
        reviewLeave,
        addCaregiver,
        addShift,
        manualAssign,
        confirmClientStop,
        addPairingExclusion,
        deletePairingExclusion: (id) => save({ ...data, pairingExclusions: data.pairingExclusions.filter((item) => item.id !== id) }),
        reset: () => save(createSeed()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('缺少 AppProvider');
  return value;
}
