import { useState, useEffect, useRef } from 'react';
import LandingPage          from './components/LandingPage.jsx';
import ProductTypeSelector  from './components/ProductTypeSelector.jsx';
import SkinTypeSelector     from './components/SkinTypeSelector.jsx';
import HairTypeSelector     from './components/HairTypeSelector.jsx';
import ProfileQuestionnaire from './components/ProfileQuestionnaire.jsx';
import ScanScreen           from './components/ScanScreen.jsx';
import AnalysingScreen      from './components/AnalysingScreen.jsx';
import ResultsScreen        from './components/ResultsScreen.jsx';
import ApiKeySetup          from './components/ApiKeySetup.jsx';

import { loadKnowledgeBases }                                  from './engine/knowledgeBase.js';
import { loadMatchingIndex, matchAllIngredients }              from './engine/matcher.js';
import { extractIngredients, parseManualInput }                from './engine/extractor.js';
import { calculateProductScore }                               from './engine/compatibilityEngine.js';
import { extractIngredientsWithOpenRouter, isOpenRouterConfigured } from './engine/geminiOCR.js';
import { batchAnalyseUnknowns }                                from './engine/geminiAnalysis.js';

export default function App() {
  const [screen, setScreen]             = useState('loading');
  const [productType, setProductType]   = useState(null);
  const [skinHairType, setSkinHairType] = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [report, setReport]             = useState(null);
  const [loadStatus, setLoadStatus]     = useState('Initialising AuraShield...');
  const [analysingMsg, setAnalysingMsg] = useState('');
  const [scanError, setScanError]       = useState('');

  const indexesRef = useRef(null);

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('aurashield_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const orKey = import.meta.env?.VITE_OPENROUTER_API_KEY || '';
    if (orKey && orKey.length > 10 && !orKey.includes('PASTE_YOUR')) {
      window.__OR_KEY__ = orKey;
      sessionStorage.setItem('auroshield_or_key', orKey);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadStatus('Loading ingredient database...');
        const indexes = await loadKnowledgeBases();
        indexesRef.current = indexes;
        loadMatchingIndex(Object.keys(indexes.ingredientIndex));
        setScreen(isOpenRouterConfigured() ? 'landing' : 'setup');
      } catch (err) {
        setLoadStatus('Failed to initialise. Please refresh the page.');
      }
    })();
  }, []);

  async function handleInput({ type, file, text }) {
    setScreen('analysing');
    setAnalysingMsg('Reading your product label...');
    try {
      let extractedIngredients = [];
      if (type === 'image') {
        const result = await extractIngredientsWithOpenRouter(file, null, (msg) => setAnalysingMsg(msg));
        extractedIngredients = result.ingredients;
      } else {
        extractedIngredients = text.toLowerCase().includes('ingredient') ? extractIngredients(text) : parseManualInput(text);
      }

      if (!extractedIngredients.length) {
        setScreen('scan');
        setScanError('No ingredients found. Please try a clearer photo or type them manually.');
        return;
      }

      setAnalysingMsg('Matching against ingredient database...');
      const matched = matchAllIngredients(extractedIngredients);
      const matchedOriginals = new Set(matched.map(m => m.original));
      const unmatched = extractedIngredients.filter(i => !matchedOriginals.has(i));

      const skinType = productType === 'skin' ? skinHairType : 'Normal Skin';
      const hairType = productType === 'hair' ? skinHairType : 'Normal Hair';
      const result = calculateProductScore(matched, skinType, hairType, productType, indexesRef.current, userProfile);

      let aiAnalysedIngredients = [];
      if (unmatched.length > 0) {
        setAnalysingMsg('Analysing unknown ingredients with AI...');
        const profile = { ...userProfile, skinType, hairType, productType };
        aiAnalysedIngredients = await batchAnalyseUnknowns(unmatched, profile, null, () => {});
      }

      result.unmatchedIngredients  = unmatched;
      result.aiAnalysedIngredients = aiAnalysedIngredients;
      result.totalExtracted        = extractedIngredients.length;
      result.userProfile           = userProfile;

      setReport(result);
      setScreen('results');
    } catch (err) {
      setScreen('scan');
      setScanError(err.message || 'Something went wrong. Please try again.');
    }
  }

  function reset() {
    setReport(null); setProductType(null); setSkinHairType(null); setUserProfile(null); setScanError('');
    setScreen(isOpenRouterConfigured() ? 'landing' : 'setup');
  }

  if (screen === 'loading') return (
    <div style={sp.page}>
      <div className="orb" style={{ position:'absolute', width:400, height:400, top:-100, right:-80, background:'radial-gradient(circle, #c9b4fa, #9668ef)' }} />
      <div className="orb" style={{ position:'absolute', width:300, height:300, bottom:-80, left:-60, background:'radial-gradient(circle, #e879c8, transparent)' }} />
      <div style={sp.logoWrap}>
        <div style={sp.logoIcon}>✦</div>
        <div className="grad-text-animated" style={sp.brand}>AuraShield</div>
      </div>
      <div style={sp.status}>{loadStatus}</div>
      <div style={sp.barWrap}>
        <div style={sp.barInner} />
      </div>
    </div>
  );

  if (screen === 'setup') return <ApiKeySetup onConfigured={(k) => { window.__OR_KEY__ = k; sessionStorage.setItem('auroshield_or_key', k); setScreen('landing'); }} />;
  if (screen === 'landing') return <LandingPage onStart={() => setScreen('productType')} geminiReady={true} />;
  if (screen === 'productType') return <ProductTypeSelector onSelect={t => { setProductType(t); setScreen(t === 'skin' ? 'skinType' : 'hairType'); }} />;
  if (screen === 'skinType') return <SkinTypeSelector onSelect={t => { setSkinHairType(t); setScreen('questionnaire'); }} onBack={() => setScreen('productType')} />;
  if (screen === 'hairType') return <HairTypeSelector onSelect={t => { setSkinHairType(t); setScreen('questionnaire'); }} onBack={() => setScreen('productType')} />;
  if (screen === 'questionnaire') return <ProfileQuestionnaire productType={productType} skinOrHairType={skinHairType} onComplete={p => { setUserProfile(p); setScreen('scan'); }} onBack={() => setScreen(productType === 'skin' ? 'skinType' : 'hairType')} />;
  if (screen === 'scan') return <ScanScreen productType={productType} profileType={skinHairType} geminiEnabled={true} geminiError={scanError} onAnalyse={handleInput} onBack={() => setScreen('questionnaire')} />;
  if (screen === 'analysing') return <AnalysingScreen productType={productType} profileType={skinHairType} customMsg={analysingMsg} />;
  if (screen === 'results') return <ResultsScreen report={report} productType={productType} geminiEnabled={true} onReset={reset} />;
  return null;
}

const sp = {
  page: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)', position:'relative', overflow:'hidden' },
  logoWrap: { display:'flex', alignItems:'center', gap:12 },
  logoIcon: { width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg, #9668ef, #e879c8)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:20, boxShadow:'0 8px 24px rgba(150,104,239,0.4)' },
  brand: { fontSize:28, fontWeight:700, fontFamily:"'Playfair Display', serif" },
  status: { fontSize:13, color:'var(--text3)', letterSpacing:'0.02em' },
  barWrap: { width:200, height:4, background:'var(--bg3)', borderRadius:2, overflow:'hidden', marginTop:8 },
  barInner: { height:'100%', width:'60%', background:'linear-gradient(90deg, #9668ef, #c9b4fa)', borderRadius:2, animation:'shimmer 1.5s linear infinite', backgroundSize:'200% auto' },
};
