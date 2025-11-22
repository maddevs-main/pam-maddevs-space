"use client";
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, createGlobalStyle } from 'styled-components';

const theme = {
  colors: {
    bg: '#000000',
    primary: '#75725F',
    mid: '#B4B4B2',
    light: '#F1F1F1',
    black: 'rgb(0, 0, 0)',
    primaryRgb: 'rgb(117, 114, 95)',
    midRgb: 'rgb(180, 180, 178)',
    lightRgb: 'rgb(241, 241, 241)'
  },
  spacing: {
    page: '24px',
    section: '16px',
    buttonGap: '12px'
  },
  fonts: {
    body: 'Inter, system-ui, Arial, sans-serif'
  }
};

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  html, body, #__next { height: 100%; }
  body {
    margin: 0;
    background: ${theme.colors.bg};
    color: ${theme.colors.light};
    font-family: ${theme.fonts.body};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.25;
    font-size: 18px;
  }

  h1, h2, h3, h4, h5 {
    margin: 0 0 8px 0;
    font-weight: 800;
    color: ${theme.colors.light};
  }

  h1 { font-size: 40px; }
  h2 { font-size: 32px; }
  h3 { font-size: 24px; }

  p, span, label {
    color: ${theme.colors.mid};
    margin: 0;
  }

  a { color: ${theme.colors.primary}; text-decoration: none; }

  button {
    font-family: ${theme.fonts.body};
    font-weight: 600;
    background: ${theme.colors.primary};
    color: ${theme.colors.light};
    border: none;
    padding: 10px 16px;
    cursor: pointer;
    letter-spacing: 0.2px;
    border-radius: 6px; /* subtle corner radius */
  }

  /* focus-visible for accessibility */
  :focus {
    outline: none;
  }
  :focus-visible {
    outline: 3px solid rgba(241,241,241,0.08);
    outline-offset: 2px;
  }

  /* utility to space flat buttons */
  .btn-row { display: flex; gap: ${theme.spacing.buttonGap}; }

  input, textarea, select {
    background: transparent;
    color: ${theme.colors.light};
    border: 1px solid ${theme.colors.mid};
    padding: 8px 10px;
    border-radius: 6px;
  }

  /* minimal container */
  .page-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: ${theme.spacing.page};
  }
`;

export const StyledButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return <button {...props} />;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const originalFetch = window.fetch.bind(window);
      // wrap global fetch to add Authorization header when pam_jwt is present
      (window as any).fetch = async (input: RequestInfo, init?: RequestInit) => {
        try {
          const token = window.localStorage.getItem('pam_jwt');
          const mergedInit: RequestInit = { ...(init || {}) };
          const headers = new Headers(mergedInit.headers || undefined);
          if (token) headers.set('Authorization', `Bearer ${token}`);
          mergedInit.headers = headers;
          return await originalFetch(input, mergedInit);
        } catch (e) {
          return await originalFetch(input, init);
        }
      };
      return () => { (window as any).fetch = originalFetch; };
    } catch (e) {
      // noop
    }
  }, []);
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
