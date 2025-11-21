"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const SessionLoader = dynamic(() => import('./SessionLoader'), { ssr: false });

export default function SessionLoaderWrapper({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(false);
  useEffect(() => {
    // Only show loader once per session (until tab/browser closed)
    if (typeof window !== 'undefined') {
      if (!window.sessionStorage.getItem('sessionLoaderShown')) {
        setShowLoader(true);
      }
    }
  }, []);
  const handleDone = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('sessionLoaderShown', '1');
    }
    setShowLoader(false);
  };
  return (
    <>
      {showLoader && <SessionLoader onDone={handleDone} />}
      {children}
    </>
  );
}
