import { useRef, useState, useEffect } from 'react';

export default function ScanScreen({ productType, profileType, geminiEnabled, geminiError, onAnalyse, onBack }) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState('choice');
  const [manualText, setManualText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [retryFile, setRetryFile] = useState(null);
  const countdownRef = useRef(null);

  const isSkin = productType === 'skin';
  const accent = isSkin ? '#9668ef' : '#e879c8';

  const isQuotaError = geminiError && (geminiError.includes('rate limit') || geminiError.includes('Rate limit') || geminiError.includes('quota') || geminiError.includes('429'));

  useEffect(() => { setCountdown(0); }, []);
  useEffect(() => { if (isQuotaError && countdown === 0) setCountdown(60); }, [geminiError]);
  useEffect(() => {
    if (countdown <= 0) { clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(countdownRef.current); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [countdown]);

  function handleFiles(files) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setRetryFile(file);
    onAnalyse({ type: 'image', file });
  }

  function handleRetry() {
    if (retryFile) onAnalyse({ type: 'image', file: retryFile });
    else inputRef.current?.click();
    setCountdown(0);
  }

  function handleManualSubmit() {
    if (manualText.trim().length < 3) return;
    onAnalyse({ type: 'manual', text: manualText });
  }

  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 350, height: 350, top: -80, right: -60, background: `radial-gradient(circle, ${accent}55, transparent)` }} />
      <div className="orb" style={{ width: 280, height: 280, bottom: -60, left: -40, background: 'radial-gradient(circle, #c9b4fa, transparent)' }} />

      <div style={s.inner} className="fade-up">
        <button style={s.backBtn} onClick={onBack}>← Back</button>

        <div style={s.profileBar}>
          <span style={{ ...s.chip, borderColor: accent + '44', color: accent, background: accent + '10' }}>
            {isSkin ? '🧴 Skin Product' : '💆 Hair Product'}
          </span>
          <span style={s.arrow}>→</span>
          <span style={s.chip2}>{profileType}</span>
        </div>

        <div className="petal-chip" style={{ alignSelf: 'flex-start', color: accent, borderColor: accent + '44', background: accent + '10' }}>Scan Ingredients</div>

        <h2 style={s.title}>
          {mode === 'manual' ? 'Type your ingredients' : 'Scan your product label'}
        </h2>
        <p style={s.sub}>
          {mode === 'manual'
            ? 'Paste the full ingredients list from the label or brand website'
            : 'Upload a clear photo of the ingredients list — AI reads any label'}
        </p>

        {/* Error banners */}
        {geminiError && isQuotaError && (
          <div style={s.quotaBanner}>
            <div style={s.quotaRow}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Scan temporarily paused</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Please try again or type ingredients manually below</div>
              </div>
              {countdown > 0 ? (
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, position: 'absolute' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="2.5"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#f59e0b" strokeWidth="2.5"
                      strokeDasharray={`${2*Math.PI*18}`}
                      strokeDashoffset={`${2*Math.PI*18*(1-countdown/60)}`}
                      strokeLinecap="round"
                      style={{ transform:'rotate(-90deg)', transformOrigin:'22px 22px', transition:'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{countdown}</span>
                </div>
              ) : (
                <button style={{ padding: '8px 16px', borderRadius: 50, background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }} onClick={handleRetry}>Retry →</button>
              )}
            </div>
          </div>
        )}

        {geminiError && !isQuotaError && (
          <div style={s.errorBanner}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Scan failed</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{geminiError}</div>
            </div>
            <button style={{ padding: '6px 14px', borderRadius: 50, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>Retry</button>
          </div>
        )}

        {/* Upload zone */}
        {mode === 'choice' && (
          <div style={s.scanArea}>
            <div
              style={{ ...s.uploadZone, ...(dragOver ? { borderColor: accent, background: accent + '08', transform: 'scale(1.005)' } : {}) }}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            >
              <div style={{ ...s.uploadIconCircle, background: accent + '14', border: `1.5px solid ${accent}25` }}>
                <span style={{ fontSize: 36 }}>📸</span>
              </div>
              <div style={s.uploadTitle}>Upload Product Label Photo</div>
              <div style={s.uploadHint}>Clear photo of the ingredients list — any angle</div>
              <div style={{ ...s.uploadButton, background: `linear-gradient(135deg, ${accent}, #b08ef6)` }}>Choose Photo</div>
              <div style={s.fileTypes}>JPG · PNG · WEBP · HEIC</div>
              <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            </div>

            <div style={s.divider}>
              <span style={s.dividerLine} />
              <span style={s.dividerText}>or</span>
              <span style={s.dividerLine} />
            </div>

            <button style={s.manualBtn} onClick={() => setMode('manual')}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✏️</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Type ingredients manually</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>Paste from label or brand website</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 20 }}>›</span>
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <div style={s.manualArea}>
            <button style={s.backSmall} onClick={() => setMode('choice')}>← Back</button>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Paste the full ingredients list:</label>
            <textarea
              style={s.textarea}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Retinol, Phenoxyethanol…"
              rows={8}
              autoFocus
            />
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{manualText.split(',').filter(t => t.trim()).length} ingredients detected</span>
            </div>
            <button
              style={{ ...s.analyseBtn, background: manualText.trim().length > 3 ? `linear-gradient(135deg, ${accent}, #b08ef6)` : 'var(--bg3)', cursor: manualText.trim().length > 3 ? 'pointer' : 'not-allowed', opacity: manualText.trim().length > 3 ? 1 : 0.5 }}
              onClick={handleManualSubmit}
              disabled={manualText.trim().length < 3}
            >
              🔬 Analyse Ingredients
            </button>
          </div>
        )}

        <div style={s.tips}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📌 Tips for best results</div>
          {['Hold phone steady — blurry photos miss ingredients', 'Capture the full list — don\'t crop the bottom', 'Good lighting makes small text readable'].map(t => (
            <div key={t} style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
              <span style={{ color: accent, fontSize: 8, marginTop: 4 }}>●</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' },
  inner: { maxWidth: 560, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 5 },
  backBtn: { alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' },
  profileBar: { display: 'flex', alignItems: 'center', gap: 10 },
  chip: { padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, border: '1px solid' },
  arrow: { color: 'var(--text-muted)', fontSize: 14 },
  chip2: { padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, background: 'var(--bg2)', color: 'var(--text3)', border: '1px solid var(--border)' },
  title: { fontSize: 28, fontWeight: 400, color: 'var(--text)', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.3px' },
  sub: { fontSize: 14, color: 'var(--text3)', lineHeight: 1.65, marginTop: -8 },
  quotaBanner: { background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '14px 16px' },
  quotaRow: { display: 'flex', alignItems: 'center', gap: 12 },
  errorBanner: { display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--red-soft)', border: '1.5px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius)', padding: '14px 16px' },
  scanArea: { display: 'flex', flexDirection: 'column', gap: 12 },
  uploadZone: { position: 'relative', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '44px 28px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' },
  uploadIconCircle: { width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 19, fontWeight: 700, color: 'var(--text)', fontFamily: "'Playfair Display', serif" },
  uploadHint: { fontSize: 13, color: 'var(--text3)', maxWidth: 300 },
  uploadButton: { padding: '12px 32px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700, color: 'white', marginTop: 4, boxShadow: '0 4px 14px rgba(150,104,239,0.3)' },
  fileTypes: { fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  divider: { display: 'flex', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  manualBtn: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' },
  manualArea: { display: 'flex', flexDirection: 'column', gap: 12 },
  backSmall: { alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' },
  textarea: { width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', padding: '14px 16px', fontSize: 13, resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box', outline: 'none' },
  analyseBtn: { padding: '15px', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 700, color: 'white', border: 'none', width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(150,104,239,0.3)' },
  tips: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '16px 20px', border: '1px solid var(--border)' },
};
