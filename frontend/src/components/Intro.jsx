import React from 'react';
import '../styles/Intro.css';

function Intro() {
  return (
    <div className="intro-container">
      <div className="hero-card">
        <div className="hero-copy">
          <h2>Build realistic synthetic datasets for testing, analytics, and AI.</h2>
          <p>
            Upload sample data or define a schema, then generate clean synthetic datasets with realistic structure and values.
          </p>
          <div className="hero-pill-list">
            <span>Sample-based generation</span>
            <span>Schema-driven fabrication</span>
          </div>
          <p className="hero-instruction">Open the menu and choose your workflow to begin.</p>
        </div>

        <div className="hero-visual">
          <div className="data-cube">
            <div className="cube-face"></div>
            <div className="cube-face"></div>
            <div className="cube-face"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Intro;
