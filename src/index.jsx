import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './styles/tailwind.css';
import './styles/index.css';

import { ThemeProvider as LayoutThemeProvider } from './contexts/ThemeContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';
import { ToastProvider } from './components/ui/ToastNotification';

// Easter egg for the developer console
console.log(
  '%c Crafted with ❤️ by M Alfin Firdaus (traezkdev) %c',
  'background: #222; color: #bada55; font-size: 14px; border-radius: 5px; padding: 5px;',
  ''
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <DarkModeProvider>
          <LayoutThemeProvider>
            <OrderNotificationProvider>
              <ChatProvider>
                <CallProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </CallProvider>
              </ChatProvider>
            </OrderNotificationProvider>
          </LayoutThemeProvider>
        </DarkModeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
