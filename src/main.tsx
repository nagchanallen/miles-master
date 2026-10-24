import React from 'react';
import ReactDOM from 'react-dom/client';
import 'semantic-ui-css/components/reset.min.css';
import 'semantic-ui-css/components/site.min.css';
import 'semantic-ui-css/components/button.min.css';
import 'semantic-ui-css/components/card.min.css';
import 'semantic-ui-css/components/form.min.css';
import 'semantic-ui-css/components/message.min.css';
import 'semantic-ui-css/components/icon.min.css';
import './style.css';
import './i18n';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
