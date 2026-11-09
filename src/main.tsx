import React, { Profiler } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {import.meta.env.DEV && new URLSearchParams(window.location.search).has('profile') ? (
      <Profiler
        id="workspace"
        onRender={(_id, phase, actualDuration) =>
          console.info(
            '[MarkEdit profile]',
            JSON.stringify({ phase, renderMs: Number(actualDuration.toFixed(2)) }),
          )
        }
      >
        <App />
      </Profiler>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
