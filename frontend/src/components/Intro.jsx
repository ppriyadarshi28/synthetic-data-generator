import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import '../styles/Intro.css';

const SampleCardIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M4 19h16v2H2V3h2v16zm3-2h2V9H7v8zm4 0h2V5h-2v12zm4 0h2v-6h-2v6zm4 0h2V7h-2v10z" />
  </SvgIcon>
);

const SchemaCardIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M7 7h4v4H7V7zm6 0h4v4h-4V7zM7 13h4v4H7v-4zm8-2h2v2h-2v4h-2v-4h-2v-2h2V7h2v4z" />
  </SvgIcon>
);

function Intro() {
  return (
    <div className="intro-container">
      <div className="hero-card">
        <div className="hero-copy">
          <h2>Build realistic synthetic datasets for testing, analytics, and AI.</h2>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-card-header">
                <span className="feature-icon" aria-hidden="true">
                  <SampleCardIcon fontSize="small" />
                </span>
                <h3>Sample-based generation</h3>
              </div>
              <p>Upload a representative dataset and generate realistic synthetic rows that preserve useful structure and patterns.</p>
            </article>

            <article className="feature-card">
              <div className="feature-card-header">
                <span className="feature-icon" aria-hidden="true">
                  <SchemaCardIcon fontSize="small" />
                </span>
                <h3>Schema-driven fabrication</h3>
              </div>
              <p>Define columns and data types, then produce high-quality mock records for testing, demos, and analysis.</p>
            </article>
          </div>

          <p className="hero-instruction">Choose your workflow from the left pane to begin.</p>
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
