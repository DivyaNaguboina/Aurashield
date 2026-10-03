import { useState, useEffect } from 'react';

export default function LandingPage({ onStart, geminiReady }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('aurashield_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aurashield_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <div style={s.page}>
      {/* Orbs */}
      <div className="orb" style={{ width: 500, height: 500, top: -120, right: -100, background: 'radial-gradient(circle, #c9b4fa, #9668ef)' }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: -80, left: -80, background: 'radial-gradient(circle, #e879c8, #b08ef6)' }} />
      <div className="orb" style={{ width: 250, height: 250, top: '45%', left: '20%', background: 'radial-gradient(circle, #e0d4fd, transparent)' }} />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.logoIcon}>✦</div>
          <span className="grad-text" style={s.navBrand}>AuraShield</span>
        </div>
        <div style={s.navRight}>
          <span style={s.navTag}>✦ Gemini AI · 30,000+ Ingredients</span>
          <button style={s.themeToggle} onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge} className="fade-up">
            <span style={s.badgeDot} />
            AI-powered · Personalised · Instant
          </div>

          <h1 style={s.h1} className="fade-up">
            Your skin deserves
            <br />
            <span className="grad-text-animated">the truth.</span>
          </h1>

          <p style={s.sub} className="fade-up">
            AuraShield decodes every ingredient in your skincare and haircare —
            personalised to your unique skin profile. Real results, no guessing.
          </p>

          <div style={s.features} className="fade-up">
            {[
              { icon: '🔬', text: 'Gemini Vision reads any label' },
              { icon: '🧬', text: '30,000+ ingredients indexed' },
              { icon: '✨', text: 'Personalised to your profile' },
              { icon: '⚡', text: 'Results in seconds' },
            ].map(({ icon, text }) => (
              <div key={text} style={s.featureChip}>
                <span>{icon}</span>
                <span style={s.featureText}>{text}</span>
              </div>
            ))}
          </div>

          <button style={s.ctaBtn} className="fade-up btn-primary" onClick={onStart}>
            Analyse My Product ✦
          </button>

          <p style={s.disclaimer} className="fade-up">
            No account needed · Private & secure · Free to use
          </p>
        </div>

        {/* Hero visual */}
        <div style={s.heroVisual} className="float">
          <div style={s.productCard}>
            <div style={s.cardHeader}>
              <div style={s.cardHeaderLeft}>
                <div style={s.productName}>Premium Face Serum</div>
                <div style={s.productSub}>15 active compounds verified</div>
              </div>
              <div style={s.scoreCircle}>
                <span style={s.scoreNum}>87</span>
                <span style={s.scoreSub}>/100</span>
              </div>
            </div>

            <div style={s.verdictBadge}>✓ Excellent formulation</div>

            <div style={s.ingList}>
              {[
                { name: 'Niacinamide', tag: 'Hero Active', color: '#34d399' },
                { name: 'Hyaluronic Acid', tag: 'Deep Hydration', color: '#818cf8' },
                { name: 'Glycerin', tag: 'Humectant', color: '#b08ef6' },
              ].map(({ name, tag, color }) => (
                <div key={name} style={s.ingRow}>
                  <div style={s.ingDot(color)} />
                  <span style={s.ingName}>{name}</span>
                  <span style={{ ...s.ingTag, color, background: color + '18', border: `1px solid ${color}30` }}>{tag}</span>
                </div>
              ))}
            </div>

            <div style={s.cardDecor} />
          </div>
        </div>
      </main>

      {/* Trust strip */}
      <div style={s.trustStrip}>
        {['Dermatologist-grade data', 'EU Cosmetic Regulation compliant', 'SVHC allergen detection', 'Privacy-first — nothing stored'].map(t => (
          <span key={t} style={s.trustItem}>
            <span style={s.dot} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border)' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, boxShadow: '0 4px 12px var(--accent-glow)' },
  navBrand: { fontSize: 20, fontWeight: 700, letterSpacing: '0.02em', fontFamily: "'Playfair Display', serif" },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  navTag: { fontSize: 11, fontWeight: 600, color: 'var(--text3)', background: 'var(--accent-soft)', padding: '5px 14px', borderRadius: 50, border: '1px solid var(--border)' },
  themeToggle: { width: 36, height: 36, borderRadius: '50%', background: 'var(--bg2)', border: '1px solid var(--border)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  hero: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64, padding: '60px 48px', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 5 },
  heroInner: { flex: 1, maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 24 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border2)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 8px var(--accent)' },
  h1: { fontSize: 52, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-1px', color: 'var(--text)', fontFamily: "'Playfair Display', serif" },
  sub: { fontSize: 16, color: 'var(--text3)', lineHeight: 1.75, maxWidth: 460 },
  features: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  featureChip: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 500, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', boxShadow: 'var(--shadow-sm)' },
  featureText: { color: 'var(--text2)' },
  ctaBtn: { alignSelf: 'flex-start', padding: '16px 36px', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.03em', background: 'var(--grad-main)', color: 'white', boxShadow: '0 6px 24px var(--accent-glow)' },
  disclaimer: { fontSize: 12, color: 'var(--text-muted)' },
  heroVisual: { flexShrink: 0 },
  productCard: { width: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardHeaderLeft: {},
  productName: { fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  productSub: { fontSize: 11, color: 'var(--text4)', marginTop: 2 },
  scoreCircle: { width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #34d399', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', flexShrink: 0 },
  scoreNum: { fontSize: 17, fontWeight: 800, color: '#34d399', lineHeight: 1 },
  scoreSub: { fontSize: 9, color: 'var(--text4)' },
  verdictBadge: { padding: '6px 14px', borderRadius: 50, fontSize: 11, fontWeight: 600, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center' },
  ingList: { display: 'flex', flexDirection: 'column', gap: 2 },
  ingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' },
  ingDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  ingName: { fontSize: 12, color: 'var(--text2)', fontWeight: 500, flex: 1 },
  ingTag: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50 },
  cardDecor: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(150,104,239,0.1), transparent 70%)' },
  trustStrip: { display: 'flex', justifyContent: 'center', gap: 32, padding: '16px 48px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--surface2)' },
  trustItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 500, color: 'var(--text3)' },
  dot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' },
};
