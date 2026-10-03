export default function ProductTypeSelector({ onSelect }) {
  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 400, height: 400, top: -100, right: -80, background: 'radial-gradient(circle, #c9b4fa, #9668ef)' }} />
      <div className="orb" style={{ width: 350, height: 350, bottom: -80, left: -60, background: 'radial-gradient(circle, #e879c8, #b08ef6)' }} />

      <div style={s.header}>
        <div style={s.logoIcon}>✦</div>
        <span className="grad-text" style={s.brand}>AuraShield</span>
      </div>

      <div style={s.container} className="fade-up">
        <div className="petal-chip" style={{ alignSelf: 'center', marginBottom: 4 }}>Step 1 of 3</div>

        <h2 style={s.title}>
          What are you<br />
          <span className="grad-text" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>scanning today?</span>
        </h2>
        <p style={s.sub}>Choose the product category to personalise your analysis</p>

        <div style={s.cards}>
          <button style={s.card} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(150,104,239,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow)'; }} onClick={() => onSelect('skin')}>
            <div style={s.cardIconWrap('#9668ef')}>
              <span style={{ fontSize: 32 }}>🧴</span>
            </div>
            <div style={s.cardTitle}>Skin Products</div>
            <div style={s.cardSub}>Face creams, serums, moisturisers, sunscreens, cleansers and more</div>
            <div style={s.tagRow}>
              {['Moisturiser', 'Serum', 'Sunscreen', 'Cleanser', 'Toner'].map(t => (
                <span key={t} style={s.tag('#9668ef')}>{t}</span>
              ))}
            </div>
            <div style={s.cardCta}>Analyse Skin Product →</div>
          </button>

          <button style={s.card} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(232,121,200,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow)'; }} onClick={() => onSelect('hair')}>
            <div style={s.cardIconWrap('#e879c8')}>
              <span style={{ fontSize: 32 }}>💆</span>
            </div>
            <div style={s.cardTitle}>Hair Products</div>
            <div style={s.cardSub}>Shampoos, conditioners, hair oils, masks, serums and treatments</div>
            <div style={s.tagRow}>
              {['Shampoo', 'Conditioner', 'Hair Oil', 'Mask', 'Serum'].map(t => (
                <span key={t} style={s.tag('#e879c8')}>{t}</span>
              ))}
            </div>
            <div style={{ ...s.cardCta, color: '#e879c8' }}>Analyse Hair Product →</div>
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '32px 20px', background: 'var(--bg)' },
  header: { position: 'absolute', top: 24, left: 36, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 },
  logoIcon: { width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, boxShadow: '0 4px 12px var(--accent-glow)' },
  brand: { fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 5, maxWidth: 760, width: '100%' },
  title: { fontSize: 36, fontWeight: 400, textAlign: 'center', lineHeight: 1.25, color: 'var(--text)', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: 'var(--text3)', textAlign: 'center', marginTop: -8 },
  cards: { display: 'flex', gap: 20, width: '100%', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: 280, padding: 28, borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left', transition: 'all 0.25s ease', boxShadow: 'var(--shadow)' },
  cardIconWrap: (color) => ({ width: 64, height: 64, borderRadius: 18, background: color + '14', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  cardTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: "'Playfair Display', serif" },
  cardSub: { fontSize: 13, color: 'var(--text3)', lineHeight: 1.65 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: (color) => ({ padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, background: color + '12', color, border: `1px solid ${color}22` }),
  cardCta: { fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginTop: 4, letterSpacing: '0.02em' },
};
