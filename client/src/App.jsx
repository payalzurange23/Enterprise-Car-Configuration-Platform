import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Car, Settings, CreditCard, Save, History, User, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const STEPS = [
  { id: 'model', name: 'Model', icon: <Car size={20} /> },
  { id: 'engine', name: 'Engine', icon: <Settings size={20} /> },
  { id: 'transmission', name: 'Transmission', icon: <Settings size={20} /> },
  { id: 'trim', name: 'Trim', icon: <Settings size={20} /> },
  { id: 'exterior', name: 'Exterior', icon: <Settings size={20} /> },
  { id: 'interior', name: 'Interior', icon: <Settings size={20} /> },
  { id: 'wheels', name: 'Wheels', icon: <Settings size={20} /> },
  { id: 'packages', name: 'Packages', icon: <Settings size={20} /> },
  { id: 'review', name: 'Review', icon: <CheckCircle size={20} /> }
];

function App() {
  const [view, setView] = useState('wizard'); // wizard or history
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [options, setOptions] = useState(null);
  const [history, setHistory] = useState([]);
  const [selection, setSelection] = useState({
    modelId: null,
    engineId: null,
    transmissionId: null,
    trimId: null,
    exteriorId: null,
    interiorId: null,
    wheelsId: null,
    packageIds: []
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    fetchOptions();
    const storedUser = localStorage.getItem('ecp_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (selection.modelId) {
      validateAndPrice();
    }
  }, [selection]);

  const fetchOptions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/options`);
      setOptions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching options", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  const validateAndPrice = async () => {
    try {
      const priceRes = await axios.post(`${API_BASE}/price`, { selection });
      setTotalPrice(priceRes.data.totalPrice);

      const validRes = await axios.post(`${API_BASE}/validate`, { selection });
      setViolations(validRes.data.violations);
    } catch (err) {
      console.error("Error in validation/pricing", err);
    }
  };

  const handleSelect = (key, id) => {
    if (key === 'packageIds') {
      const newPackages = selection.packageIds.includes(id)
        ? selection.packageIds.filter(p => p !== id)
        : [...selection.packageIds, id];
      setSelection({ ...selection, [key]: newPackages });
    } else {
      setSelection({ ...selection, [key]: id });
    }
  };

  const handleSave = async (type) => {
    if (!user) {
      alert("Please login to save your configuration.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/save`, {
        config: selection,
        totalPrice,
        type
      });
      if (res.data.success) {
        setSaveSuccess(`Successfully saved as ${type.toUpperCase()}!`);
        setTimeout(() => setSaveSuccess(null), 5000);
        fetchHistory();
      }
    } catch (err) {
      console.error("Save failed", err);
    }
    setSaving(false);
  };

  const handleLogin = (name) => {
    const newUser = { name, email: `${name.toLowerCase()}@enterprise.com`, role: 'Client' };
    setUser(newUser);
    localStorage.setItem('ecp_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ecp_user');
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (loading) return <div className="loading-screen">
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
      <Settings size={48} color="var(--primary)" />
    </motion.div>
    <p>Initializing ECP Enterprise Engine...</p>
  </div>;

  return (
    <div className="app-container">
      {!user && <LoginModal onLogin={handleLogin} />}

      {/* Modern Header */}
      <header className="glass header">
        <div className="header-left">
          <div className="logo-box">
            <Car color="white" size={24} />
          </div>
          <div>
            <h1 className="logo-text">ECP <span className="logo-subtext">Enterprise</span></h1>
            <div className="user-badge"><User size={10} /> {user ? user.name : 'Guest'} • {user ? user.role : 'Unauthorized'}</div>
          </div>
        </div>
        
        <div className="header-center">
          <nav className="top-nav">
            <button className={`nav-link ${view === 'wizard' ? 'active' : ''}`} onClick={() => setView('wizard')}>Build & Price</button>
            <button className={`nav-link ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); fetchHistory(); }}>Order History</button>
          </nav>
        </div>

        <div className="header-right">
          <div className="price-display">
            <div className="price-label">Live Estimate</div>
            <div className="price-value">${totalPrice.toLocaleString()}</div>
          </div>
          {user && <button onClick={handleLogout} className="logout-btn" title="Logout"><LogOut size={18} /></button>}
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {view === 'wizard' ? (
            <motion.div 
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="wizard-container"
            >
              {/* Step Indicator */}
              <div className="step-indicator">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className={`step-item ${idx <= currentStep ? 'active' : ''} ${idx === currentStep ? 'current' : ''}`}>
                    <div className="step-icon-box">{step.icon}</div>
                    <span className="step-name">{step.name}</span>
                    {idx < STEPS.length - 1 && <div className="step-line" />}
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="content-grid">
                <div className="glass panel left-panel">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={STEPS[currentStep].id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <StepContent 
                        stepId={STEPS[currentStep].id} 
                        options={options} 
                        selection={selection} 
                        handleSelect={handleSelect}
                        violations={violations}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="panel-footer">
                    <button className="btn btn-secondary" onClick={prevStep} disabled={currentStep === 0}>
                      <ChevronLeft size={18} /> Back
                    </button>
                    
                    {currentStep < STEPS.length - 1 ? (
                      <button 
                        className="btn btn-primary" 
                        onClick={nextStep} 
                        disabled={!isStepComplete(STEPS[currentStep].id, selection)}
                      >
                        Next Step <ChevronRight size={18} />
                      </button>
                    ) : (
                      <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => handleSave('quote')} disabled={saving || !selection.modelId}>
                          <CreditCard size={18} /> Save Quote
                        </button>
                        <button className="btn btn-primary" onClick={() => handleSave('order')} disabled={saving || !selection.modelId}>
                          <Save size={18} /> Place Order
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {saveSuccess && <div className="toast success">{saveSuccess}</div>}
                </div>

                <div className="glass panel right-panel">
                  <h3>Vehicle Intelligence</h3>
                  <div className="preview-box">
                    {selection.modelId ? (
                      <div className="car-preview">
                        <motion.img 
                          layoutId="car-img"
                          src={options.models.find(m => m.id === selection.modelId).image} 
                          alt="Car" 
                          className="car-img-large"
                        />
                        <h4 className="car-title">{options.models.find(m => m.id === selection.modelId).name}</h4>
                        <p className="car-subtitle">Corporate Fleet Identification: {selection.modelId.toUpperCase()}</p>
                      </div>
                    ) : (
                      <div className="empty-preview">
                        <Car size={64} className="faded-icon" />
                        <p>Awaiting model selection for telemetry data...</p>
                      </div>
                    )}
                  </div>

                  <div className="summary-section">
                     <h4>CONFIGURATION ATTRIBUTES</h4>
                     <div className="summary-grid">
                        <SummaryItem label="Engine" value={getOptionName(options, 'engines', selection.engineId)} />
                        <SummaryItem label="Exterior" value={getOptionName(options, 'exteriors', selection.exteriorId)} />
                        <SummaryItem label="Interior" value={getOptionName(options, 'interiors', selection.interiorId)} />
                        <SummaryItem label="Trim" value={getOptionName(options, 'trims', selection.trimId)} />
                     </div>
                  </div>

                  {violations.length > 0 && (
                    <div className="alert-box danger">
                      <div className="alert-header">
                        <AlertTriangle size={18} /> <span>RULE VIOLATION DETECTED</span>
                      </div>
                      <div className="alert-body">
                        {violations.map((v, i) => <p key={i}>❌ {v.rule}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="history-container glass panel"
            >
              <div className="history-header">
                <h2>Corporate Build Repository</h2>
                <div className="history-meta">{history.length} active configurations found</div>
              </div>
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Config ID</th>
                      <th>Model Name</th>
                      <th>Type</th>
                      <th>Total Cost</th>
                      <th>Date Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id}>
                        <td className="mono">{item.id.slice(-8)}</td>
                        <td><strong>{item.name}</strong></td>
                        <td><span className={`badge ${item.type}`}>{item.type.toUpperCase()}</span></td>
                        <td className="accent-text">${item.totalPrice?.toLocaleString()}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td><button className="view-btn" onClick={() => setSelectedHistory(item)}>View Telemetry</button></td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No configurations found in the enterprise repository.</td></tr>}
                  </tbody>
                </table>
              </div>
              
              {/* Telemetry Detail Overlay */}
              <AnimatePresence>
                {selectedHistory && (
                  <div className="modal-overlay" onClick={() => setSelectedHistory(null)}>
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="glass detail-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-header">
                        <h3>Configuration Telemetry: {selectedHistory.id.slice(-8)}</h3>
                        <button className="close-btn" onClick={() => setSelectedHistory(null)}><X size={20} /></button>
                      </div>
                      <div className="detail-content">
                        <div className="detail-row"><span>Platform:</span> <strong>{getOptionName(options, 'models', selectedHistory.config.modelId)}</strong></div>
                        <div className="detail-row"><span>Power Unit:</span> <strong>{getOptionName(options, 'engines', selectedHistory.config.engineId)}</strong></div>
                        <div className="detail-row"><span>Module:</span> <strong>{getOptionName(options, 'transmissions', selectedHistory.config.transmissionId)}</strong></div>
                        <div className="detail-row"><span>Finish:</span> <strong>{getOptionName(options, 'exteriors', selectedHistory.config.exteriorId)}</strong></div>
                        <div className="detail-row"><span>Cabin:</span> <strong>{getOptionName(options, 'interiors', selectedHistory.config.interiorId)}</strong></div>
                        <div className="detail-row"><span>Wheels:</span> <strong>{getOptionName(options, 'wheels', selectedHistory.config.wheelsId)}</strong></div>
                        <div className="detail-row"><span>Add-ons:</span> <strong>{selectedHistory.config.packageIds?.map(pId => options.packages.find(p => p.id === pId)?.name).join(', ') || 'None'}</strong></div>
                      </div>
                      <div className="modal-footer">
                        <div className="total-box">
                          <span>Final Asset Value</span>
                          <div className="val">${selectedHistory.totalPrice?.toLocaleString()}</div>
                        </div>
                        <button className="btn btn-primary" onClick={() => { setSelection(selectedHistory.config); setView('wizard'); setSelectedHistory(null); }}>Load Configuration</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
         <p>© 2026 ECP Enterprise Automotive Systems v2.1.0 • Secured for Student Evaluation</p>
      </footer>
    </div>
  );
}

function StepContent({ stepId, options, selection, handleSelect, violations }) {
  const getStepData = () => {
    switch(stepId) {
      case 'model': return { title: 'Base Unit Selection', key: 'modelId', items: options.models };
      case 'engine': return { title: 'Powertrain Engineering', key: 'engineId', items: options.engines };
      case 'transmission': return { title: 'Transmission Module', key: 'transmissionId', items: options.transmissions };
      case 'trim': return { title: 'Trim & Equipment Package', key: 'trimId', items: options.trims };
      case 'exterior': return { title: 'Surface Coating (Paint)', key: 'exteriorId', items: options.exteriors };
      case 'interior': return { title: 'Cabin Architecture', key: 'interiorId', items: options.interiors };
      case 'wheels': return { title: 'Rim Selection', key: 'wheelsId', items: options.wheels };
      case 'packages': return { title: 'Auxiliary Enterprise Packs', key: 'packageIds', items: options.packages, multiple: true };
      case 'review': return { title: 'Configuration Verification', key: null, items: [] };
      default: return null;
    }
  };

  const data = getStepData();
  if (!data) return null;

  if (stepId === 'review') {
    // Creative: Calculate dynamic car metrics
    const calculateMetrics = () => {
      let power = 40, luxury = 30, efficiency = 50, innovative = 20;
      
      const e = options.engines.find(i => i.id === selection.engineId);
      if (e?.type === 'electric') { power += 30; efficiency += 40; innovative += 40; }
      if (e?.type === 'petrol' && e.name.includes('V6')) { power += 50; efficiency -= 20; }
      
      const tr = options.trims.find(i => i.id === selection.trimId);
      if (tr?.id === 'tr2') { power += 20; }
      if (tr?.id === 'tr3') { luxury += 50; }
      
      const int = options.interiors.find(i => i.id === selection.interiorId);
      if (int?.id === 'int2') luxury += 20;

      selection.packageIds.forEach(pId => {
        if (pId === 'p1') innovative += 30;
        if (pId === 'p3') luxury += 10;
      });

      return { power: Math.min(100, power), luxury: Math.min(100, luxury), efficiency: Math.min(100, efficiency), innovative: Math.min(100, innovative) };
    };

    const metrics = calculateMetrics();

    return (
      <div className="review-view">
        <h2 className="step-title">{data.title}</h2>
        
        <div className="creative-review-grid">
          <div className="technical-scan">
            <div className="scan-status-bar">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: '100%' }} 
                 transition={{ duration: 2, ease: "linear" }}
                 className="scan-line"
               />
               <span>SYSTEM INTEGRITY SCAN: COMPLETED</span>
            </div>
            <div className="metrics-container">
              <MetricBar label="Power & Propulsion" value={metrics.power} color="#ef4444" />
              <MetricBar label="Cabin Luxury Index" value={metrics.luxury} color="#a855f7" />
              <MetricBar label="Energy Efficiency" value={metrics.efficiency} color="#22c55e" />
              <MetricBar label="Enterprise Innovation" value={metrics.innovative} color="#3b82f6" />
            </div>
          </div>

          <div className="review-list compact">
            <ReviewRow label="Base Platform" value={getOptionName(options, 'models', selection.modelId)} />
            <ReviewRow label="Power Unit" value={getOptionName(options, 'engines', selection.engineId)} />
            <ReviewRow label="Gear Module" value={getOptionName(options, 'transmissions', selection.transmissionId)} />
            <ReviewRow label="Interior Tier" value={getOptionName(options, 'trims', selection.trimId)} />
            <ReviewRow label="Visual Coating" value={getOptionName(options, 'exteriors', selection.exteriorId)} />
            <ReviewRow label="Add-on Modules" value={selection.packageIds.length + " Active Packs"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-view">
      <h2 className="step-title">{data.title}</h2>
      <p className="step-desc">Select an authorized module to integrate into the vehicle architecture.</p>
      
      <div className="options-grid">
        {data.items.map(item => {
          const isSelected = data.multiple 
            ? selection[data.key].includes(item.id) 
            : selection[data.key] === item.id;
          
          const isInvalid = violations.some(v => v.invalidValue === item.id);

          return (
            <motion.div 
              whileHover={!isInvalid ? { y: -5, scale: 1.02 } : {}}
              whileTap={!isInvalid ? { scale: 0.98 } : {}}
              key={item.id}
              onClick={() => !isInvalid && handleSelect(data.key, item.id)}
              className={`option-card ${isSelected ? 'selected' : ''} ${isInvalid ? 'invalid' : ''}`}
            >
              <div className="card-header">
                <span className="item-name">{item.name}</span>
                {isSelected && <CheckCircle size={18} color="var(--primary)" />}
              </div>
              <div className="item-price">
                {item.price > 0 ? `+$${item.price.toLocaleString()}` : (item.basePrice ? `$${item.basePrice.toLocaleString()}` : 'Standard Issue')}
              </div>
              {item.image && <img src={item.image} className="item-img" />}
              {item.hex && <div className="color-strip" style={{ background: item.hex }} />}
              {isInvalid && (
                <div className="invalid-overlay">
                  <AlertTriangle size={24} />
                  <span>Module Conflict</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Sub-components
const LoginModal = ({ onLogin }) => {
  const [name, setName] = useState('');
  return (
    <div className="modal-overlay">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass login-modal">
        <div style={{ background: 'var(--primary)', height: '8px', width: '100%', position: 'absolute', top: 0, left: 0 }} />
        <h2>Enterprise Gateway</h2>
        <p>Please authenticate to access the Vehicle Configuration Environment.</p>
        <div className="input-field">
          <label>Employee Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
        </div>
        <button className="btn btn-primary full-width" onClick={() => name.trim() && onLogin(name)}>Initialize Session</button>
        <div className="viva-note">Student Project: Any name will work (Basic Simulation)</div>
      </motion.div>
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div className="summary-item">
    <div className="label">{label}</div>
    <div className="value">{value || 'N/A'}</div>
  </div>
);

const ReviewRow = ({ label, value }) => (
  <div className="review-row">
    <span className="label">{label}</span>
    <span className="value">{value || '—'}</span>
  </div>
);

const MetricBar = ({ label, value, color }) => (
  <div className="metric-box">
    <div className="metric-header">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="bar-bg">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
        className="bar-fill" 
        style={{ backgroundColor: color }} 
      />
    </div>
  </div>
);

function isStepComplete(stepId, selection) {
  if (stepId === 'packages' || stepId === 'review') return true;
  return selection[stepId + 'Id'] !== null;
}

function getOptionName(options, category, id) {
  if (!options || !id) return null;
  const item = options[category].find(i => i.id === id);
  return item ? item.name : null;
}

export default App;
