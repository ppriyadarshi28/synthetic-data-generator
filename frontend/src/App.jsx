import React, { useState } from 'react';
import GenerateFromSample from './components/GenerateFromSample';
import FabricateFromSchema from './components/FabricateFromSchema';
import Intro from './components/Intro';
import './App.css';

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
                className={activeSection === 'home' ? 'nav-button active' : 'nav-button'}
                onClick={() => setActiveSection('home')}
              >
                <span className="nav-icon">🏠</span>
                <span>Overview</span>
              </button>

              <button
                className={activeSection === 'sample' ? 'nav-button active' : 'nav-button'}
                onClick={() => setActiveSection('sample')}
              >
                <span className="nav-icon">📊</span>
                <span>Generate from Sample</span>
              </button>

              <button
                className={activeSection === 'schema' ? 'nav-button active' : 'nav-button'}
                onClick={() => setActiveSection('schema')}
              >
                <span className="nav-icon">🧩</span>
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
