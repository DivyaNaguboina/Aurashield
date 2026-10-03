export default function SkinTypeSelector({ onSelect, onBack }) {
  const SKIN_TYPES = [
    { value: 'Normal Skin',      icon: '✨', color: '#34d399', desc: 'Balanced sebum, small pores, clear skin surface',      traits: ['Balanced', 'Healthy glow', 'Stable'] },
    { value: 'Dry Skin',         icon: '🌵', color: '#f59e0b', desc: 'Feels tight, rough texture, needs rich hydration',       traits: ['Tight', 'Flaky', 'Low moisture'] },
    { value: 'Oily Skin',        icon: '💧', color: '#818cf8', desc: 'Excess sebum, visible gloss, enlarged pores',            traits: ['Shiny', 'Large pores', 'Sebum'] },
    { value: 'Combination Skin', icon: '⚡', color: '#b08ef6', desc: 'Oily T-zone with normal or dry cheeks',                  traits: ['Mixed zones', 'Variable', 'Dual care'] },
    { value: 'Sensitive Skin',   icon: '🌸', color: '#f87171', desc: 'Reacts to actives, prone to flushing and redness',       traits: ['Reactive', 'Easily triggered', 'Stings'] },
    { value: 'Acne-Prone Skin',  icon: '🔴', color: '#fca5a5', desc: 'Frequent breakouts, congested pores, inflammation',      traits: ['Congested', 'Breakout-prone', 'Inflamed'] },
  ];

  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 350, height: 350, top: -80, right: -60, background: 'radial-gradient(circle, #c9b4fa, transparent)' }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: -60, left: -40, background: 'radial-gradient(circle, #e879c8, transparent)' }} />

      <div style={s.inner} className="fade-up">
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div className="petal-chip" style={{ alignSelf: 'center' }}>Step 2 of 3 · Skin Mapping</div>
        <h2 style={s.title}>What's your <span className="grad-text" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>skin type?</span></h2>
        <p style={s.sub}>We'll personalise the ingredient analysis to your skin's unique needs</p>

        <div style={s.grid}>
          {SKIN_TYPES.map(({ value, icon, color, desc, traits }) => (
            <button key={value} style={s.card}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              onClick={() => onSelect(value)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '14', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: "'Playfair Display', serif" }}>{value}</span>
              </div>
              <p style={s.cardDesc}>{desc}</p>
              <div style={s.traits}>
                {traits.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 50, color, background: color + '12', border: `1px solid ${color}20` }}>{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' },
  inner: { maxWidth: 900, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative', zIndex: 5 },
  backBtn: { alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 50, fontSize: 12, fontWeight: 600, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' },
  title: { fontSize: 32, fontWeight: 400, textAlign: 'center', color: 'var(--text)', fontFamily: "'Playfair Display', serif" },
  sub: { fontSize: 14, color: 'var(--text3)', textAlign: 'center', maxWidth: 420 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, width: '100%' },
  card: { padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface)', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' },
  cardDesc: { fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, margin: 0 },
  traits: { display: 'flex', flexWrap: 'wrap', gap: 5 },
};
