import { useState } from 'react';

/* ─── Metric Gauge ─── */
function MetricGauge({ label, value, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}/100</span>
      </div>
      <div style={{ width: '100%', height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: value + '%', height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease-out', boxShadow: '0 0 8px ' + color + '40' }} />
      </div>
    </div>
  );
}

/* ─── Risk Bar ─── */
function RiskBar({ breakdown = {}, total = 0 }) {
  if (!total) return null;
  const h = Math.round(((breakdown.HIGH || 0) / total) * 100);
  const m = Math.round(((breakdown.MEDIUM || 0) / total) * 100);
  const l = 100 - h - m;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
      <div style={{ display: 'flex', gap: 2, height: 7, borderRadius: 4, overflow: 'hidden' }}>
        {h > 0 && <div style={{ width: h + '%', background: 'var(--red)' }} />}
        {m > 0 && <div style={{ width: m + '%', background: 'var(--yellow)' }} />}
        {l > 0 && <div style={{ width: l + '%', background: 'var(--green)' }} />}
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)' }}>
        {(breakdown.HIGH || 0) > 0 && <span style={{ color: 'var(--red)' }}>High: {breakdown.HIGH}</span>}
        {(breakdown.MEDIUM || 0) > 0 && <span style={{ color: 'var(--yellow)' }}>Med: {breakdown.MEDIUM}</span>}
        <span style={{ color: 'var(--green)' }}>Safe: {breakdown.LOW || 0}</span>
      </div>
    </div>
  );
}

/* ─── Ingredient Card ─── */
function IngCard({ d = {}, expanded, setExpanded, onLogReaction, hasReacted }) {
  const isOpen = expanded === d.name;
  const scoreVal = d.score ?? 0;
  const compatLabel = d.compatLabel || 'Neutral';
  const hazards = d.hazards || [];
  const flags = d.flags || {};

  const compatColor = {
    'Excellent': 'var(--green)', 'Very Good': 'var(--green)', 'Good': 'var(--blue)',
    'Neutral': 'var(--text4)', 'Mild Concern': 'var(--yellow)', 'Concern': '#f97316',
    'Strong Concern': 'var(--red)', 'Avoid': 'var(--red)',
  }[compatLabel] || 'var(--text4)';

  const dotColor = scoreVal >= 8 ? 'var(--green)' : scoreVal >= 0 ? 'var(--blue)' : scoreVal >= -8 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ ...sI.card, borderColor: scoreVal < -5 ? 'rgba(248,113,113,0.3)' : scoreVal >= 8 ? 'rgba(52,211,153,0.3)' : 'var(--border)' }}>
      <div style={sI.row} onClick={() => setExpanded(isOpen ? null : d.name)}>
        <div style={sI.left}>
          <div style={{ ...sI.dot, background: dotColor }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.name || 'Unknown'}</div>
            {d.original && d.original !== d.name && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Extracted: {d.original}</div>}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{d.function || 'Cosmetic Ingredient'}</div>
          </div>
        </div>
        <div style={sI.right}>
          <span style={{ ...sI.badge, color: compatColor, background: compatColor.replace('var(', '').replace(')', '') === compatColor ? compatColor + '14' : 'var(--bg2)', border: '1px solid ' + compatColor + '30' }}>{compatLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: scoreVal >= 0 ? 'var(--green)' : 'var(--red)', minWidth: 24, textAlign: 'right' }}>{scoreVal >= 0 ? '+' : ''}{scoreVal}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>{isOpen ? 'CLOSE' : 'MORE'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={sI.detail}>
          {d.desc && <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.65, margin: '0 0 10px' }}>{d.desc}</p>}

          {d.personalConflicts && d.personalConflicts.length > 0 && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--yellow-soft)', borderLeft: '3px solid var(--yellow)', borderRadius: 6 }}>
              {d.personalConflicts.map((conf, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600, marginTop: i > 0 ? 4 : 0 }}>{conf}</div>
              ))}
            </div>
          )}

          {d.alternative && (
            <div style={{ background: 'var(--accent-soft)', border: '1px dashed var(--border2)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Safer Alternative</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 3 }}>{d.alternative.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.5 }}>{d.alternative.note}</div>
            </div>
          )}

          {hazards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {hazards.map(h => (
                <div key={h.key} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid', borderColor: h.severity === 'CRITICAL' ? 'rgba(248,113,113,0.35)' : 'rgba(245,158,11,0.3)', background: h.severity === 'CRITICAL' ? 'var(--red-soft)' : 'var(--yellow-soft)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: h.severity === 'CRITICAL' ? 'var(--red)' : 'var(--yellow)' }}>{h.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{h.description}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {flags.allergen    && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, color: 'var(--yellow)', background: 'var(--yellow-soft)', border: '1px solid rgba(245,158,11,0.25)' }}>Allergen</span>}
            {flags.comedogenic && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, color: 'var(--pink)', background: 'var(--pink-soft)', border: '1px solid rgba(232,121,200,0.25)' }}>Comedogenic</span>}
            {flags.superstar   && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, color: 'var(--green)', background: 'var(--green-soft)', border: '1px solid rgba(52,211,153,0.25)' }}>Hero Ingredient</span>}
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
            Match method: {d.matchMethod || 'Exact'} · Confidence: {Math.round((d.matchScore || 1) * 100)}%
          </div>

          <button
            style={{ background: hasReacted ? 'var(--red-soft)' : 'var(--bg2)', border: '1px solid ' + (hasReacted ? 'rgba(248,113,113,0.3)' : 'var(--border)'), color: hasReacted ? 'var(--red)' : 'var(--text3)', padding: '7px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center' }}
            onClick={e => { e.stopPropagation(); onLogReaction(d.name); }}>
            {hasReacted ? 'Logged in your reaction history' : 'Log personal reaction to this ingredient'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── AI Ingredient Card ─── */
function AiIngCard({ ing = {}, expanded, setExpanded }) {
  const isOpen = expanded === ing.ingredient;
  if (!ing || !ing.ingredient) return null;
  const tierColor = { safe: 'var(--green)', monitor: 'var(--blue)', caution: 'var(--yellow)', avoid: 'var(--red)' }[ing.safetyTier] || 'var(--text4)';
  return (
    <div style={{ ...sI.card, borderLeft: '2px solid var(--accent3)' }}>
      <div style={sI.row} onClick={() => setExpanded(isOpen ? null : ing.ingredient)}>
        <div style={sI.left}>
          <div style={{ ...sI.dot, background: tierColor }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{ing.inci || ing.ingredient}</div>
            {ing.commonName && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ing.commonName}</div>}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{ing.function || 'Active Ingredient'}</div>
          </div>
        </div>
        <div style={sI.right}>
          <span style={{ padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--border2)' }}>AI</span>
          <span style={{ ...sI.badge, color: tierColor, background: 'var(--bg2)', border: '1px solid ' + tierColor + '30' }}>{ing.safetyTier || 'Monitor'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>{isOpen ? 'CLOSE' : 'MORE'}</span>
        </div>
      </div>
      {isOpen && (
        <div style={sI.detail}>
          <div style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', marginBottom: 10 }}>
            Analysed by AI (OpenRouter) — not in the local ingredient database
          </div>
          <div style={{ background: ing.suitableForProfile ? 'var(--green-soft)' : 'var(--red-soft)', border: '1px solid ' + (ing.suitableForProfile ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'), borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ing.suitableForProfile ? 'var(--green)' : 'var(--red)' }}>
              {ing.suitableForProfile ? 'Compatible with your profile' : 'Not ideal for your profile'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{ing.profileReason || ''}</div>
          </div>
          {(ing.benefits || []).length > 0 && (
            <div>{ing.benefits.map(b => <div key={b} style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>+ {b}</div>)}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Results Screen ─── */
export default function ResultsScreen({ report = {}, productType, onReset }) {
  const isSkin = productType === 'skin';
  const score              = report.score ?? 0;
  const confidenceScore    = report.confidenceScore ?? 95;
  const details            = report.details || [];
  const avoidIngredients   = report.avoidIngredients || [];
  const riskBreakdown      = report.riskBreakdown || { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const totalMatched       = report.totalMatched || details.length;
  const aiAnalysedIngredients = report.aiAnalysedIngredients || [];
  const userProfile        = report.userProfile || {};
  const metrics            = report.metrics || {};
  const interactions       = report.interactions || [];
  const routine            = report.routine || {};

  const [openSections, setOpenSections] = useState({ metrics: false, ingredients: true, routine: false, interactions: false });
  const [expandedIng, setExpandedIng]   = useState(null);
  const [reactionHistory, setReactionHistory] = useState(() => JSON.parse(localStorage.getItem('auroshield_reaction_history') || '[]'));
  const [ingFilter, setIngFilter] = useState('all');

  function toggleSection(key) { setOpenSections(p => ({ ...p, [key]: !p[key] })); }

  function logAdverseReaction(ingName) {
    const target = ingName.toUpperCase();
    const updated = reactionHistory.includes(target) ? reactionHistory.filter(x => x !== target) : [...reactionHistory, target];
    setReactionHistory(updated);
    localStorage.setItem('auroshield_reaction_history', JSON.stringify(updated));
    alert(reactionHistory.includes(target) ? 'Removed from your reaction history.' : 'Added to your reaction history. Future scans will flag this ingredient.');
  }

  let verdict = { title: 'Not Recommended', color: 'var(--red)',    desc: 'Critical conflicts detected. Avoid using on ' + (isSkin ? 'skin.' : 'hair/scalp.'), icon: '✗' };
  if (score >= 75) verdict = { title: 'Safe to Use',      color: 'var(--green)',  desc: 'High compatibility with your ' + (isSkin ? 'skin' : 'hair/scalp') + ' profile. Monitor on first use.', icon: '✓' };
  else if (score >= 45) verdict = { title: 'Patch Test First', color: 'var(--yellow)', desc: 'Mild concerns found. Run a 72-hour ' + (isSkin ? 'skin' : 'scalp') + ' patch test before full use.', icon: '~' };

  // Filter ingredients
  const filteredDetails = ingFilter === 'concerns' ? details.filter(d => d.score < 0)
    : ingFilter === 'beneficial' ? details.filter(d => d.score >= 5)
    : details;

  // Skin vs hair metric config
  const skinMetricConfig = [
    { label: 'Dermal Safety Score',    value: metrics.safetyScore   ?? 80, color: 'var(--green)' },
    { label: 'Acne / Comedogenic Risk', value: metrics.acneRisk      ?? 20, color: 'var(--red)'   },
    { label: 'Hydration Score',         value: metrics.hydrationScore ?? 60, color: 'var(--blue)'  },
    { label: 'Allergen Exposure Risk',  value: metrics.allergenRisk  ?? 10, color: 'var(--yellow)' },
  ];
  const hairMetricConfig = [
    { label: 'Scalp Health Score',    value: metrics.scalpHealth  ?? 75, color: 'var(--green)'  },
    { label: 'Hair Strength Score',   value: metrics.hairStrength ?? 60, color: 'var(--blue)'   },
    { label: 'Moisture Balance',      value: metrics.moisture     ?? 55, color: 'var(--accent)' },
    { label: 'Allergen / Irritant Risk', value: metrics.allergenRisk ?? 15, color: 'var(--yellow)' },
  ];
  const metricConfig = isSkin ? skinMetricConfig : hairMetricConfig;

  return (
    <div style={s.page}>
      <div className="orb" style={{ position: 'fixed', width: 400, height: 400, top: -100, right: -80, background: 'radial-gradient(circle, #c9b4fa30, transparent)', pointerEvents: 'none' }} />
      <div className="orb" style={{ position: 'fixed', width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle, #e879c830, transparent)', pointerEvents: 'none' }} />

      <div style={s.inner} className="print-area fade-in">

        {/* Top bar */}
        <div style={s.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #9668ef, #e879c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13 }}>✦</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: "'Playfair Display', serif" }}>AuraShield</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.outlineBtn} onClick={() => window.print()}>Export</button>
            <button style={s.primaryBtn} onClick={onReset}>Scan Another</button>
          </div>
        </div>

        {/* Profile chips */}
        <div style={s.chipBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>Your Profile</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="petal-chip">{isSkin ? '🧴 Skin' : '💆 Hair'} · {isSkin ? report.skinType : report.hairType}</span>
            <span className="petal-chip">Reactivity: {(userProfile.sensitivityLevel || 'normal').charAt(0).toUpperCase() + (userProfile.sensitivityLevel || 'normal').slice(1)}</span>
            {isSkin && userProfile.isPregnant && <span style={{ padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, border: '1px solid rgba(240,163,222,0.4)', color: 'var(--pink)', background: 'var(--pink-soft)' }}>Pregnancy Mode</span>}
            {(userProfile.concerns || []).slice(0, 3).map(c => <span key={c} className="petal-chip">{c}</span>)}
            {(userProfile.allergies || []).slice(0, 2).map(a => <span key={a} style={{ padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, border: '1px solid rgba(248,113,113,0.35)', color: 'var(--red)', background: 'var(--red-soft)' }}>No {a}</span>)}
          </div>
        </div>

        {/* Score card */}
        <div style={{ ...s.scoreBox, borderColor: verdict.color + '40', background: verdict.color + '06' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', border: '3px solid ' + verdict.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', boxShadow: '0 0 20px ' + verdict.color + '25', flexShrink: 0 }}>
              <span style={{ fontSize: 23, fontWeight: 800, color: verdict.color, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>/100</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: verdict.color, fontFamily: "'Playfair Display', serif" }}>{verdict.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, lineHeight: 1.55 }}>{verdict.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent-soft)', padding: '5px 12px', borderRadius: 50, color: 'var(--accent)', border: '1px solid var(--border)' }}>
              {confidenceScore}% confidence
            </span>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>{totalMatched} ingredients matched</span>
          </div>
        </div>

        {/* Interactions banner */}
        {interactions.length > 0 && (
          <div style={s.interactions}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Ingredient Interactions Detected
            </div>
            {interactions.map((ix, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < interactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ix.type === 'SYNERGY' ? '💎' : ix.type === 'CONTRAINDICATION' ? '🚨' : '⚠️'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ix.type === 'SYNERGY' ? 'var(--green)' : ix.type === 'CONTRAINDICATION' ? 'var(--red)' : 'var(--yellow)' }}>{ix.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{ix.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Biomarker Breakdown — skin or hair specific labels */}
        <div style={s.accordion}>
          <div style={s.accordionHeader} onClick={() => toggleSection('metrics')}>
            <span>{isSkin ? 'Skin Biomarker Breakdown' : 'Hair & Scalp Health Breakdown'}</span>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>{openSections.metrics ? 'Collapse ↑' : 'Expand ↓'}</span>
          </div>
          {openSections.metrics && (
            <div style={s.accordionBody}>
              {metricConfig.map(m => <MetricGauge key={m.label} label={m.label} value={m.value} color={m.color} />)}
            </div>
          )}
        </div>

        {/* Ingredients Analysis */}
        <div style={s.accordion}>
          <div style={s.accordionHeader} onClick={() => toggleSection('ingredients')}>
            <span>Ingredient Analysis ({details.length + aiAnalysedIngredients.length} total)</span>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>{openSections.ingredients ? 'Collapse ↑' : 'Expand ↓'}</span>
          </div>
          {openSections.ingredients && (
            <div style={s.accordionBody}>
              {avoidIngredients.length > 0 && (
                <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(248,113,113,0.25)', padding: '12px 14px', borderRadius: 12, marginBottom: 14 }}>
                  <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    {isSkin ? 'Ingredients to Avoid for Your Skin:' : 'Ingredients Incompatible with Your Hair/Scalp:'}
                  </div>
                  {avoidIngredients.map(i => <div key={i.name} style={{ fontSize: 12, color: 'var(--red)', marginTop: 3 }}>• {i.name}</div>)}
                </div>
              )}

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[{ key: 'all', label: 'All (' + details.length + ')' }, { key: 'concerns', label: 'Concerns (' + details.filter(d => d.score < 0).length + ')' }, { key: 'beneficial', label: 'Beneficial (' + details.filter(d => d.score >= 5).length + ')' }].map(({ key, label }) => (
                  <button key={key}
                    style={{ padding: '5px 14px', borderRadius: 50, fontSize: 11, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', background: ingFilter === key ? 'var(--accent-soft)' : 'var(--surface)', color: ingFilter === key ? 'var(--accent)' : 'var(--text3)', borderColor: ingFilter === key ? 'var(--accent)' : 'var(--border)', transition: 'all 0.15s' }}
                    onClick={() => setIngFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>

              {filteredDetails.map(d => (
                <IngCard key={d.name} d={d} expanded={expandedIng} setExpanded={setExpandedIng}
                  onLogReaction={logAdverseReaction} hasReacted={reactionHistory.includes(d.name.toUpperCase())} />
              ))}

              {aiAnalysedIngredients.length > 0 && ingFilter === 'all' && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AI-Analysed Ingredients ({aiAnalysedIngredients.length} — not in local database)
                  </div>
                  {aiAnalysedIngredients.map(ing => <AiIngCard key={ing.ingredient} ing={ing} expanded={expandedIng} setExpanded={setExpandedIng} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Personalised Routine — fully separated for skin vs hair */}
        <div style={s.accordion}>
          <div style={s.accordionHeader} onClick={() => toggleSection('routine')}>
            <span>{isSkin ? 'Personalised Skincare Routine' : 'Personalised Haircare Routine'}</span>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>{openSections.routine ? 'Collapse ↑' : 'Expand ↓'}</span>
          </div>
          {openSections.routine && (
            <div style={s.accordionBody}>
              {isSkin ? (
                // Skin routine: Morning + Night
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: 'var(--yellow-soft)', padding: 16, borderRadius: 14, border: '1px dashed rgba(245,158,11,0.25)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 13, marginBottom: 12 }}>Morning Routine</div>
                    {(routine.morning || []).map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', margin: '7px 0', paddingLeft: 10, borderLeft: '2px solid var(--yellow)', lineHeight: 1.55 }}>
                        <span style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 700, display: 'block', marginBottom: 1 }}>Step {i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--blue-soft)', padding: 16, borderRadius: 14, border: '1px dashed rgba(129,140,248,0.25)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 13, marginBottom: 12 }}>Night Routine</div>
                    {(routine.night || []).map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', margin: '7px 0', paddingLeft: 10, borderLeft: '2px solid var(--blue)', lineHeight: 1.55 }}>
                        <span style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 700, display: 'block', marginBottom: 1 }}>Step {i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Hair routine: Wash Day + Treatment
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: 'var(--accent-soft)', padding: 16, borderRadius: 14, border: '1px dashed var(--border2)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13, marginBottom: 12 }}>Wash Day Steps</div>
                    {(routine.washDay || []).map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', margin: '7px 0', paddingLeft: 10, borderLeft: '2px solid var(--accent)', lineHeight: 1.55 }}>
                        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 1 }}>Step {i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--green-soft)', padding: 16, borderRadius: 14, border: '1px dashed rgba(52,211,153,0.25)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13, marginBottom: 12 }}>Weekly Treatments</div>
                    {(routine.treatment || []).map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', margin: '7px 0', paddingLeft: 10, borderLeft: '2px solid var(--green)', lineHeight: 1.55 }}>
                        <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, display: 'block', marginBottom: 1 }}>Tip {i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Match Distribution */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Match quality distribution across {totalMatched} ingredients:</div>
          <RiskBar breakdown={riskBreakdown} total={totalMatched} />
        </div>

        {/* Footer disclaimer */}
        <div style={s.footer}>
          This report is a personalised reference guide based on cosmetic ingredient databases and AI analysis. It does not constitute medical or dermatological advice. For persistent reactions or medical concerns, consult a qualified dermatologist or trichologist.
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 60px', background: 'var(--bg)', position: 'relative', overflowY: 'auto' },
  inner: { maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 5, position: 'relative' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 4 },
  outlineBtn: { padding: '8px 18px', borderRadius: 50, fontSize: 12, fontWeight: 700, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' },
  primaryBtn: { padding: '8px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #9668ef, #e879c8)', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px rgba(150,104,239,0.3)' },
  chipBox: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' },
  scoreBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderRadius: 16, padding: '16px 20px', flexWrap: 'wrap', gap: 12 },
  interactions: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' },
  accordion: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' },
  accordionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', fontWeight: 700, fontSize: 14, color: 'var(--text)', cursor: 'pointer' },
  accordionBody: { padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)' },
  footer: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' },
};

const sI = {
  card: { background: 'var(--surface)', border: '1px solid', borderRadius: 12, overflow: 'hidden', marginBottom: 6 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer' },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  badge: { padding: '3px 8px', borderRadius: 50, fontSize: 10, fontWeight: 700 },
  detail: { padding: '14px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' },
};
