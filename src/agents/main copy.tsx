import React from 'react';
import ReactDOM from 'react-dom/client';
import AgentsApp from './AgentsApp';
import '../index.css';

ReactDOM.createRoot(document.getElementById('agents-root')!).render(
  <React.StrictMode>
    <AgentsApp />
  </React.StrictMode>
);
