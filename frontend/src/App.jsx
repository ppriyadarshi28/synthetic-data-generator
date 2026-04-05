import React, { useState } from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import GenerateFromSample from './components/GenerateFromSample';
import FabricateFromSchema from './components/FabricateFromSchema';
import Intro from './components/Intro';
import './App.css';

const HomeIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M12 3.2 3 10h2v10h5v-6h4v6h5V10h2l-9-6.8z" />
  </SvgIcon>
);

const SampleIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M4 19h16v2H2V3h2v16zm3-2h2V9H7v8zm4 0h2V5h-2v12zm4 0h2v-6h-2v6zm4 0h2V7h-2v10z" />
  </SvgIcon>
);

const SchemaIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M10 4V2H4v6h2V6h4V4zm10 0h-6v2h4v2h2V4zM6 16H4v4h4v-2H6v-2zm12 2h-4v2h6v-4h-2v2zM7 11h4.5v2h1V9H7v2zm5.5 0H17v2h-4.5v-2z" />
    <circle cx="7" cy="11" r="2" />
    <circle cx="12" cy="16" r="2" />
    <circle cx="17" cy="11" r="2" />
  </SvgIcon>
);

function App() {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <div className="App">
      <header className="App-header">
        <div className="brand">
          <div className="brand-mark">SDG</div>
          <div>
            <h1>Synthetic Data Generator</h1>
            <p>Build realistic synthetic data for testing, analytics, and AI.</p>
          </div>
        </div>

        <button
          type="button"
          className={activeSection === 'home' ? 'header-home-button active' : 'header-home-button'}
          onClick={() => setActiveSection('home')}
          aria-label="Overview"
        >
          <span className="header-overview-icon" aria-hidden="true">
            <HomeIcon fontSize="small" />
          </span>
        </button>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <div className="sidebar-head">
              <span className="eyebrow">Workflows</span>
              <h2>Select a mode</h2>
            </div>

            <nav className="sidebar-nav">
              <button
                className={activeSection === 'sample' ? 'nav-button active' : 'nav-button'}
                onClick={() => setActiveSection('sample')}
              >
                <span className="nav-icon" aria-hidden="true">
                  <SampleIcon fontSize="small" />
                </span>
                <span>Generate from Sample</span>
              </button>

              <button
                className={activeSection === 'schema' ? 'nav-button active' : 'nav-button'}
                onClick={() => setActiveSection('schema')}
              >
                <span className="nav-icon" aria-hidden="true">
                  <SchemaIcon fontSize="small" />
                </span>
                <span>Fabricate from Schema</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="content-area">
          {activeSection === 'home' && <Intro />}
          {activeSection === 'sample' && <GenerateFromSample />}
          {activeSection === 'schema' && <FabricateFromSchema />}
        </main>
      </section>

      <footer className="App-footer">
        <p>Designed for fast, safe, client-ready synthetic data workflows.</p>
      </footer>
    </div>
  );
}

export default App;
