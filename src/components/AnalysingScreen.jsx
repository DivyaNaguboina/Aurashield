import { useEffect, useState } from 'react';

const STEPS = [
  { label: 'Reading product label with Gemini Vision...' },
  { label: 'Matching compounds against 30,000 ingredient records...' },
  { label: 'Analysing unknown formulation entries...' },
  { label: 'Evaluating compatibility with your profile...' },
  { label: 'Generating your personalised safety report...' },
];

export default function AnalysingScreen({ profileType, productType, customMsg }) {
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(5);

  useEffect(() => {
    const intervals = STEPS.map((_, i) =>
      setTimeout(() => { setStep(i); setPct(Math.round((i + 1) / STEPS.length * 90)); }, i * 1200)
    );
    return () => intervals.forEach(clearTimeout);
  }, []);

  const currentLabel = customMsg || STEPS[step]?.label || 'Processing...';

  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 450, height: 450, top: -100, right: -80, background: 'radial-gradient(circle, #c9b4fa, #9668ef)' }} />
      <div className="orb" style={{ width: 350, height: 350, bottom: -80, left: -60, background: 'radial-gradient(circle, #e879c8, #b08ef6)' }} />

      <div style={s.card} className="fade-up">
        <div style={s.topRow}>
          <span className="petal-chip">{productType === 'skin' ? '🧴 Skin Product' : '💆 Hair Product'}</span>
          <span style={{ padding: '5px 14px', borderRadius: 50, fontSize: 11, fontWeight: 600, background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{profileType}</span>
        </div>

        <div style={s.iconWrap}>
          <div style={s.logoCenter}>✦</div>
          <div style={s.ring1} />
          <div style={s.ring2} />
          <div style={s.ring3} />
        </div>

        <h3 style={s.title}>Analysing your product</h3>
        <div style={s.currentMsg}>{currentLabel}</div>

        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: pct + '%' }} />
        </div>
        <div style={s.pct}>{pct}%</div>

        <div style={s.stepsList}>
          {STEPS.map(({ label }, i) => (
            <div key={i} style={{ ...s.stepRow, opacity: i <= step ? 1 : 0.25, transform: i === step ? 'scale(1.01)' : 'scale(1)' }}>
              <div style={{ ...s.stepDot, background: i < step ? 'var(--green)' : i === step ? 'var(--accent)' : 'var(--border2)' }} />
              <span style={{ ...s.stepLabel, color: i === step ? 'var(--text)' : 'var(--text3)' }}>{label}</span>
              {i < step && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--green)' }}>Done</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden', background: 'var(--bg)' },
  card: { maxWidth: 440, width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 28, padding: '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-lg)', position: 'relative', zIndex: 5 },
  topRow: { display: 'flex', gap: 10, alignSelf: 'stretch', justifyContent: 'center' },
  iconWrap: { position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoCenter: { fontSize: 24, background: 'linear-gradient(135deg, #7c47e0, #9668ef, #e879c8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', position: 'relative', zIndex: 2, fontWeight: 700 },
  ring1: { position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--accent)', opacity: 0.6, animation: 'spin 3s linear infinite' },
  ring2: { position: 'absolute', inset: -8, borderRadius: '50%', border: '1.5px solid var(--accent3)', opacity: 0.3, animation: 'spinReverse 5s linear infinite' },
  ring3: { position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid var(--border)', opacity: 0.2, animation: 'spin 8s linear infinite' },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center' },
  currentMsg: { fontSize: 12, fontWeight: 500, textAlign: 'center', color: 'var(--accent)', minHeight: 20, lineHeight: 1.5 },
  barTrack: { width: '100%', height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #9668ef, #c9b4fa, #e879c8)', transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(150,104,239,0.4)' },
  pct: { fontSize: 12, fontWeight: 700, color: 'var(--accent)' },
  stepsList: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
  stepRow: { display: 'flex', alignItems: 'center', gap: 10, transition: 'opacity 0.4s, transform 0.3s' },
  stepDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, transition: 'all 0.3s' },
  stepLabel: { fontSize: 12, fontWeight: 400, transition: 'color 0.3s', lineHeight: 1.4 },
};
