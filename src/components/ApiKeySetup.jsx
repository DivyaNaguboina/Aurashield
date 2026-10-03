import { useState } from 'react';

export default function ApiKeySetup({ onConfigured }) {
  const [key, setKey]         = useState('');
  const [error, setError]     = useState('');
  const [testing, setTesting] = useState(false);

  async function handleSave() {
    const trimmed = key.trim();
    if (!trimmed || trimmed.length < 20) {
      setError('Please enter a valid OpenRouter key (starts with sk-or-v1-)');
      return;
    }
    if (!trimmed.startsWith('sk-or-')) {
      setError('Key should start with sk-or-v1-... Please check you copied the full key.');
      return;
    }
    setTesting(true); setError('');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmed}` }
      });
      if (!res.ok) throw new Error('Invalid key');
      onConfigured(trimmed);
    } catch {
      setError('Key validation failed. Please double-check and try again.');
    } finally { setTesting(false); }
  }

  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 400, height: 400, top: -100, right: -80, background: 'radial-gradient(circle, #c9b4fa, #9668ef)' }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle, #e879c8, transparent)' }} />

      <div style={s.card} className="fade-up">
        <div style={s.iconWrap}>
          <div style={s.shieldIcon}>🛡️</div>
        </div>

        <div className="petal-chip" style={{ alignSelf: 'flex-start' }}>One-time setup</div>

        <h2 style={s.title}>Add your free API key</h2>
        <p style={s.sub}>AuraShield needs an OpenRouter key to analyse ingredient labels with AI. It's completely free — takes under a minute.</p>

        <div style={s.steps}>
          {[
            { n: '1', title: 'Go to OpenRouter', body: <><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={s.link}>openrouter.ai/keys →</a></> },
            { n: '2', title: 'Sign up free', body: 'Google login works — no credit card needed' },
            { n: '3', title: 'Click "Create Key"', body: <>Copy the key starting with <code style={s.code}>sk-or-v1-...</code></> },
            { n: '4', title: 'Paste it below', body: '' },
          ].map(({ n, title, body }) => (
            <div key={n} style={s.step}>
              <div style={s.num}>{n}</div>
              <div>
                <div style={s.stitle}>{title}</div>
                {body && <div style={s.sbody}>{body}</div>}
              </div>
            </div>
          ))}
        </div>

        <input
          style={{ ...s.input, borderColor: error ? 'var(--red)' : 'var(--border)' }}
          type="password"
          placeholder="sk-or-v1-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
        />

        {error && <div style={s.error}>{error}</div>}

        <button style={{ ...s.btn, opacity: testing ? 0.75 : 1 }} onClick={handleSave} disabled={testing}>
          {testing ? '⏳ Verifying…' : '✦ Save & Start Scanning'}
        </button>

        <p style={s.note}>
          Your key lives only in your browser session — never sent anywhere except OpenRouter. The free tier is more than enough for hundreds of scans.
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' },
  card: { maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 32px', boxShadow: 'var(--shadow-lg)' },
  iconWrap: { display: 'flex', justifyContent: 'center', marginBottom: 4 },
  shieldIcon: { fontSize: 48, filter: 'drop-shadow(0 4px 12px rgba(150,104,239,0.3))' },
  title: { fontSize: 26, fontWeight: 400, color: 'var(--text)', fontFamily: "'Playfair Display', serif", margin: 0 },
  sub: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.65, margin: 0 },
  steps: { display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 16 },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  num: { width: 26, height: 26, borderRadius: '50%', background: 'var(--grad-main)', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: '0 2px 8px var(--accent-glow)' },
  stitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 },
  sbody: { fontSize: 12, color: 'var(--text3)' },
  link: { color: 'var(--accent)', textDecoration: 'underline' },
  code: { background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 6, fontSize: '0.85em', fontFamily: 'monospace' },
  input: { width: '100%', background: 'var(--bg2)', border: '1.5px solid', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  error: { fontSize: 13, color: 'var(--red)', background: 'var(--red-soft)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' },
  btn: { padding: '14px', borderRadius: 'var(--radius)', background: 'var(--grad-main)', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 4px 16px var(--accent-glow)', transition: 'all 0.2s' },
  note: { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 },
};
