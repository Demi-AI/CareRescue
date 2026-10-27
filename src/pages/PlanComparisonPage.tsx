import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { generatePlans } from '../services/rescueEngine';
import type { Plan } from '../types';
import { time } from '../utils/format';
import PlanCard from '../components/PlanCard';
import DecisionDialog from '../components/DecisionDialog';
import Icon from '../components/Icon';
import HeaderMeta from '../components/HeaderMeta';
import ConditionDialog from '../components/ConditionDialog';
export default function PlanComparisonPage() {
  const { shiftId } = useParams();
  const { data, updateShift } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [editing, setEditing] = useState(false);
  const shift = data.shifts.find((s) => s.id === shiftId);
  if (!shift)
    return (
      <>
      <h2>找不到班次</h2>
        <Link to="/dashboard">返回總覽</Link>
      </>
    );
  const result = generatePlans(data, shift);
  return (
    <>
      <header className="comparison-header">
        <div className="comparison-title">
          <Link to="/dashboard">← 返回</Link>
          <span className="comparison-separator" aria-hidden="true" />
          <h2>個案 {shift.clientId}</h2>
        </div>
        <HeaderMeta />
      </header>
      <section className="comparison-summary">
        <div><span className="summary-icon"><Icon name="clock" size={28} /></span><p>服務時段<strong>{time(shift.start)}</strong></p></div>
        <div><span className="summary-icon"><Icon name="users" size={28} /></span><p>需求條件<strong>{shift.femaleRequired ? '需女性照服員' : '無性別限制'}｜需技能 {shift.skills.join('、')}</strong></p></div>
        <button type="button" className="outline-action" onClick={() => setEditing(true)}><Icon name="edit" size={18} />　變更條件</button>
      </section>
      {shift.status !== 'pending' ? (
        <section className="panel">
          此班次已處理或取消。<Link to="/records">查看紀錄</Link>
        </section>
      ) : (
        <>
          <div className="plan-grid comparison-plans">
            {result.plans.slice(0, 3).map((p) => (
              <PlanCard key={p.id} plan={p} onSelect={setSelected} />
            ))}
          </div>
          {!result.plans.length && (
            <section className="panel">
              目前無可行方案，請查看排除原因並人工協調。
            </section>
          )}
          {!!result.excluded.length && <details className="excluded-panel"><summary>查看候選人排除原因（{result.excluded.length}）</summary><ul>{result.excluded.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>}
        </>
      )}
      {selected && (
        <DecisionDialog
          key={selected.id}
          plan={selected}
          onClose={() => setSelected(null)}
          onDone={() => navigate('/records')}
        />
      )}
      {editing && <ConditionDialog shift={shift} onClose={() => setEditing(false)} onSave={(updates) => { updateShift(shift.id, updates); setEditing(false); }} />}
    </>
  );
}
