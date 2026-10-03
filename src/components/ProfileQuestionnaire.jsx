import { useState } from 'react';

const SKIN_CONCERNS = ['Acne and Breakouts','Dark Spots','Wrinkles and Fine Lines','Redness','Dehydration','Large Pores','Uneven Texture','Sensitivity','Sun Damage','Dullness'];
const HAIR_CONCERNS = ['Hair Fall','Dandruff','Frizz','Breakage and Split Ends','Lack of Shine','Scalp Itchiness','Colour Fading','Product Build-Up','Dryness','Heat Damage'];

// Allergens split by product type
const SKIN_ALLERGENS = ['Fragrances / Parfum','Parabens','Sulphates (SLS/SLES)','Silicones','Nut Oils','Lanolin','Formaldehyde Releasers','Nickel','Essential Oils','Retinoids'];
const HAIR_ALLERGENS = ['Fragrances / Parfum','Sulphates (SLS/SLES)','Silicones','Parabens','Lanolin','Formaldehyde Releasers','Protein Hydrolysates','Keratin Treatment Chemicals','Coconut-Derived Surfactants','PPD (Hair Dye)'];

const AGE_GROUPS = [{ value:'teen',label:'Under 20' },{ value:'20s',label:'20–29' },{ value:'30s',label:'30–39' },{ value:'40s',label:'40–49' },{ value:'50plus',label:'50+' }];
const CLIMATES  = [{ value:'tropical',label:'Tropical / Humid' },{ value:'temperate',label:'Temperate' },{ value:'dry',label:'Dry / Arid' },{ value:'cold',label:'Cold / Harsh' }];

// Sensitivity is relevant for both but labelled differently
const SKIN_SENSITIVITY = [
  { value:'low',    label:'Low',    desc:'Skin rarely reacts to strong actives or new products' },
  { value:'normal', label:'Normal', desc:'Occasional reactions when changing products' },
  { value:'high',   label:'High',   desc:'Frequent reactivity — prefers gentle, minimal formulas' },
];
const HAIR_SENSITIVITY = [
  { value:'low',    label:'Low',    desc:'Scalp and hair tolerates most formulations well' },
  { value:'normal', label:'Normal', desc:'Some sensitivity to sulphates or harsh cleansers' },
  { value:'high',   label:'High',   desc:'Reactive scalp — needs fragrance-free, gentle formulas' },
];

export default function ProfileQuestionnaire({ productType, skinOrHairType, onComplete, onBack }) {
  const isSkin = productType === 'skin';
  const concerns  = isSkin ? SKIN_CONCERNS  : HAIR_CONCERNS;
  const allergens = isSkin ? SKIN_ALLERGENS : HAIR_ALLERGENS;
  const sensitivityOptions = isSkin ? SKIN_SENSITIVITY : HAIR_SENSITIVITY;

  const [step, setStep] = useState(0);
  const [selectedConcerns,  setSelectedConcerns]  = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [ageGroup,     setAgeGroup]     = useState('');
  const [climate,      setClimate]      = useState('');
  const [sensitivity,  setSensitivity]  = useState('normal');
  const [isPregnant,   setIsPregnant]   = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');

  const STEPS = [
    { id:'concerns',  title: isSkin ? 'What are your skin concerns?' : 'What are your hair concerns?',
      subtitle: isSkin ? 'Select all that apply — we\'ll tailor your ingredient compatibility analysis'
                       : 'Select all that apply — we\'ll flag ingredients that affect these specific hair issues' },
    { id:'allergens', title: isSkin ? 'Known skin allergens or sensitivities?' : 'Known scalp or hair allergens?',
      subtitle: isSkin ? 'We\'ll flag these ingredients as high priority warnings in your results'
                       : 'We\'ll highlight these in your hair product analysis results' },
    { id:'profile',   title:'A little more about you',
      subtitle:'Helps fine-tune your personalised compatibility score' },
  ];

  function toggle(list, setList, item) {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  }

  function handleComplete() {
    const allAllergens = [...selectedAllergens];
    if (customAllergy.trim()) allAllergens.push(customAllergy.trim());
    onComplete({ concerns: selectedConcerns, allergies: allAllergens, age: ageGroup, climate, sensitivityLevel: sensitivity, isPregnant: isSkin ? isPregnant : false });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={s.page}>
      <div className="orb" style={{ width: 350, height: 350, top: -80, right: -40, background: 'radial-gradient(circle, #c9b4fa, transparent)' }} />
      <div className="orb" style={{ width: 280, height: 280, bottom: -60, left: -40, background: 'radial-gradient(circle, #e879c8, transparent)' }} />

      <div style={s.inner} className="fade-up">
        <button style={s.backBtn} onClick={step === 0 ? onBack : () => setStep(p => p - 1)}>← Back</button>

        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: progress + '%' }} />
          </div>
          <span style={s.progressLabel}>Step {step + 1} of {STEPS.length}</span>
        </div>

        <div style={s.contextRow}>
          <span className="petal-chip">{isSkin ? '🧴' : '💆'} {skinOrHairType}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Personalising your profile</span>
        </div>

        <h2 style={s.title}>{STEPS[step].title}</h2>
        <p style={s.sub}>{STEPS[step].subtitle}</p>

        {/* Step 0: Concerns — skin or hair specific */}
        {step === 0 && (
          <div style={s.pillGrid}>
            {concerns.map(c => {
              const sel = selectedConcerns.includes(c);
              return (
                <button key={c}
                  style={{ ...s.pill, ...(sel ? s.pillSel : {}) }}
                  onClick={() => toggle(selectedConcerns, setSelectedConcerns, c)}>
                  {sel && '✓ '}{c}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Allergens — different lists for skin vs hair */}
        {step === 1 && (
          <>
            <div style={s.pillGrid}>
              {allergens.map(a => {
                const sel = selectedAllergens.includes(a);
                return (
                  <button key={a}
                    style={{ ...s.pill, ...(sel ? { ...s.pillSel, borderColor: 'rgba(248,113,113,0.5)', color: 'var(--red)', background: 'var(--red-soft)' } : {}) }}
                    onClick={() => toggle(selectedAllergens, setSelectedAllergens, a)}>
                    {sel && '⚠ '}{a}
                  </button>
                );
              })}
            </div>
            <div style={s.customRow}>
              <label style={s.customLabel}>
                {isSkin ? 'Other ingredient you know triggers your skin:' : 'Other ingredient you know triggers your scalp or hair:'}
              </label>
              <input style={s.customInput}
                placeholder={isSkin ? 'e.g. Alcohol Denat, Retinol...' : 'e.g. Cetrimonium Chloride, Dimethicone...'}
                value={customAllergy}
                onChange={e => setCustomAllergy(e.target.value)} />
            </div>
            <p style={s.hint}>No known allergens? Leave unselected and continue.</p>
          </>
        )}

        {/* Step 2: Age, Climate, Sensitivity — and pregnancy ONLY for skin */}
        {step === 2 && (
          <div style={s.profileFields}>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Age range</div>
              <div style={s.rowChips}>
                {AGE_GROUPS.map(({ value, label }) => (
                  <button key={value} style={{ ...s.pill, ...(ageGroup === value ? s.pillSel : {}) }} onClick={() => setAgeGroup(value)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Climate only relevant for skin — for hair we show scalp environment */}
            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>{isSkin ? 'Climate where you live' : 'Your local climate (affects scalp)'}</div>
              <div style={s.rowChips}>
                {CLIMATES.map(({ value, label }) => (
                  <button key={value} style={{ ...s.pill, ...(climate === value ? s.pillSel : {}) }} onClick={() => setClimate(value)}>{label}</button>
                ))}
              </div>
            </div>

            {/* Sensitivity — labelled for skin vs scalp */}
            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>{isSkin ? 'Skin reactivity level' : 'Scalp reactivity level'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sensitivityOptions.map(({ value, label, desc }) => (
                  <button key={value}
                    style={{ ...s.senCard, ...(sensitivity === value ? s.senCardSel : {}) }}
                    onClick={() => setSensitivity(value)}>
                    <div style={{ ...s.senDot, background: sensitivity === value ? 'var(--accent)' : 'var(--border2)' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: sensitivity === value ? 'var(--accent)' : 'var(--text)' }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pregnancy toggle — ONLY for skin products */}
            {isSkin && (
              <div style={s.fieldGroup}>
                <button
                  style={{ ...s.senCard, ...(isPregnant ? { borderColor: 'var(--pink)', background: 'var(--pink-soft)' } : {}) }}
                  onClick={() => setIsPregnant(!isPregnant)}>
                  <div style={{ ...s.senDot, background: isPregnant ? 'var(--pink)' : 'var(--border2)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isPregnant ? 'var(--pink)' : 'var(--text)' }}>
                      Pregnant or nursing
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                      Activates screening for retinoids, hydroquinone, and high-dose salicylates
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        <div style={s.navRow}>
          <button style={s.nextBtn}
            onClick={step < STEPS.length - 1 ? () => setStep(p => p + 1) : handleComplete}>
            {step < STEPS.length - 1 ? 'Continue ✦' : 'Analyse My Product ✦'}
          </button>
          <button style={s.skipBtn}
            onClick={step === STEPS.length - 1 ? handleComplete : () => setStep(p => p + 1)}>
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' },
  inner: { maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 5 },
  backBtn: { padding: '8px 18px', borderRadius: 50, fontSize: 12, fontWeight: 600, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', alignSelf: 'flex-start' },
  progressWrap: { width: '100%', display: 'flex', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #9668ef, #c9b4fa, #e879c8)', transition: 'width 0.4s ease', boxShadow: '0 0 8px rgba(150,104,239,0.4)' },
  progressLabel: { fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  contextRow: { display: 'flex', alignItems: 'center', gap: 10 },
  title: { fontSize: 24, fontWeight: 400, color: 'var(--text)', fontFamily: "'Playfair Display', serif", textAlign: 'center' },
  sub: { fontSize: 13, color: 'var(--text3)', textAlign: 'center', maxWidth: 440, lineHeight: 1.6 },
  pillGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' },
  pill: { padding: '8px 18px', borderRadius: 50, fontSize: 12, fontWeight: 500, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' },
  pillSel: { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 },
  customRow: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  customLabel: { fontSize: 12, color: 'var(--text3)' },
  customInput: { width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  hint: { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' },
  profileFields: { width: '100%', display: 'flex', flexDirection: 'column', gap: 24 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em' },
  rowChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  senCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' },
  senCardSel: { borderColor: 'var(--accent)', background: 'var(--accent-soft)' },
  senDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s' },
  navRow: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', paddingTop: 4 },
  nextBtn: { width: '100%', padding: '15px 28px', borderRadius: 18, fontSize: 15, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #9668ef, #c9b4fa, #e879c8)', boxShadow: '0 4px 20px rgba(150,104,239,0.3)', transition: 'all 0.2s' },
  skipBtn: { fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' },
};
