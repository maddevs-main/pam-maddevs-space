import React from 'react';

const LoadingScreen: React.FC = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#111',
    color: '#f5ede6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }}>
    <span style={{ fontWeight: 700, fontSize: '2.5rem', letterSpacing: '0.05em' }}>Loading</span>
  </div>
);

export default LoadingScreen;
