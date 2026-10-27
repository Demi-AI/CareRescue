import type { AppData, Plan, Shift } from '../types';
import { sameServiceDay } from '../utils/schedule';
// 合成交通矩陣：不是即時地圖資料。
const travelMinutes: Record<string, number> = {
  B0456: 8,
  C0789: 14,
  A0123: 3,
  D: 20,
  A: 10,
};
export function generatePlans(
  data: AppData,
  shift: Shift,
): { plans: Plan[]; excluded: string[] } {
  const plans: Plan[] = [];
  const excluded: string[] = [];
  for (const worker of data.caregivers) {
    const reasons: string[] = [];
    const pairingExclusion = data.pairingExclusions.find(
      (item) => item.clientId === shift.clientId && item.caregiverId === worker.id,
    );
    if (pairingExclusion)
      reasons.push(pairingExclusion.requestedBy === 'client' ? '個案端設定禁止配對' : '照服員端設定禁止配對');
    if (!worker.available) reasons.push('目前不可服務');
    if (shift.femaleRequired && !worker.female)
      reasons.push('不符合女性照服員限制');
    if (!shift.skills.every((skill) => worker.skills.includes(skill)))
      reasons.push('缺少必要技能');
    const duration = shift.end - shift.start;
    const assigned = data.shifts
      .filter(
        (s) =>
        s.id !== shift.id &&
          sameServiceDay(s, shift) &&
          s.caregiverId === worker.id &&
          s.status === 'assigned',
      )
      .reduce((sum, s) => sum + s.end - s.start, 0);
    if (worker.workMinutes + assigned + duration > worker.maxMinutes)
      reasons.push('超過工時上限');
    const travel = travelMinutes[worker.id] ?? 20;
    const busy = data.shifts.filter(
      (s) =>
        s.id !== shift.id &&
        sameServiceDay(s, shift) &&
        s.caregiverId === worker.id &&
        (s.status === 'scheduled' || s.status === 'assigned' || s.status === 'completed'),
    );
    let validStart: number | undefined;
    for (
      let start = shift.start;
      start <= shift.start + shift.maxDelay;
      start++
    ) {
      const end = start + duration;
      if (
        busy.every((s) => end + travel <= s.start || s.end + travel <= start)
      ) {
        validStart = start;
        break;
      }
    }
    if (validStart === undefined) reasons.push('服務或前後交通時間衝突');
    if (reasons.length) {
      excluded.push(`${worker.name}：${reasons.join('、')}`);
      continue;
    }
    const start = validStart!;
    const familiar = shift.familiarIds.includes(worker.id);
    const delay = start - shift.start;
    plans.push({
      id: `${shift.id}-${worker.id}`,
      shiftId: shift.id,
      caregiverId: worker.id,
      title: '',
      start,
      end: start + duration,
      travel,
      familiar,
      risk: 'high',
      tradeOff: '',
      summary: '',
      score:
        (familiar ? 0 : 100) +
        delay +
        travel -
        worker.recentRescues * 5,
    });
  }
  const ranked = plans
    .sort((a, b) => a.score - b.score)
    .map((plan, index) => {
      const risk: Plan['risk'] = index === 0 ? 'low' : index === 1 ? 'medium' : 'high';
      const delay = plan.start - shift.start;
      return {
        ...plan,
        risk,
        title:
          risk === 'low'
            ? '維持熟悉照護'
            : risk === 'medium'
              ? '負荷最公平'
              : '最快補上',
        tradeOff:
          risk === 'low'
            ? delay > 0
              ? `服務延後 ${delay} 分鐘，服務開始時間延後。`
              : '維持原服務時間，需增加交通與補班工時。'
            : risk === 'medium'
              ? '需調動調整其他班次，調度複雜度較高。'
              : '改由陌生照服員接手，照護熟悉度下降。',
        summary:
          risk === 'low'
            ? '維持熟悉照護，整體影響最小。'
            : risk === 'medium'
              ? '人力最能被平均，但調度複雜度較高。'
              : '最快補上服務，但照護連續性較差。',
      };
    });
  return { plans: ranked, excluded };
}
export function prioritized(shifts: Shift[]) {
  return [...shifts].sort(
    (a, b) => Number(b.critical) - Number(a.critical) || a.start - b.start,
  );
}
