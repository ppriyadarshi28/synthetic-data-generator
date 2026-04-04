import React from 'react';
import GenerateFromSample from './components/GenerateFromSample';
import FabricateFromSchema from './components/FabricateFromSchema';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Synthetic Data Generator</h1>
      </header>
      <main>
        <GenerateFromSample />
        <FabricateFromSchema />
      </main>
    </div>
  );
}

export default App;
