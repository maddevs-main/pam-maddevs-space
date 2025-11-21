"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.38);
  backdrop-filter: blur(10px);
  z-index: 9999;
`;

const Panel = styled.div<{ $panelColor?: string; $borderColor?: string }>`
  background: ${p => p.$panelColor || 'rgba(5,5,5,0.80)'};
  border-radius: 15px;
  width: 720px;
  max-width: calc(100% - 48px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.45);
  /* subtle darker grey border for better separation against the blurred backdrop */
  border: 1px solid ${p => p.$borderColor || 'rgba(0,0,0,0.35)'};
  display: flex;
  flex-direction: column;
  /* keep dialog within viewport and allow internal scrolling */
  max-height: 90vh;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
`;

const CloseBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  svg { width: 18px; height: 18px; }
`;

const Body = styled.div`
  padding: 14px 20px 20px 20px;
  color: #b3b3b3;
  font-size: 15px;
  overflow: auto;
  flex: 1 1 auto;

  /* style inputs inside dialogs to match the design sample */
  input, textarea, select {
    background: #2f2f2f;
    border-radius: 8px;
    border: 1px solid rgba(217,217,217,0.00);
    padding: 12px 14px;
    color: #b3b3b3;
    font-size: 15px;
    width: 100%;
    box-sizing: border-box;
  }

  textarea { min-height: 120px; }

  label { display: block; margin-bottom: 6px; color: #b3b3b3; font-weight: 500; }

  /* ensure long forms can be scrolled on small screens */
  @media (max-width: 520px) {
    padding: 12px 14px 16px 14px;
  }
`;

const Footer = styled.div`
  padding: 12px 20px 20px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
`;

export default function Dialog({ title, children, footer, onClose, panelColor, borderColor }:{ title?: string, children?: React.ReactNode, footer?: React.ReactNode, onClose?: ()=>void, panelColor?: string, borderColor?: string }) {
  if (typeof document === 'undefined') {
    // During SSR, render nothing
    return null as any;
  }

  return createPortal(
    <Overlay role="dialog" aria-modal="true">
      <Panel $panelColor={panelColor} $borderColor={borderColor}>
        <Header>
          <Title>{title}</Title>
          <CloseBtn onClick={() => onClose && onClose()} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </CloseBtn>
        </Header>
        <Body>{children}</Body>
        {footer ? <Footer>{footer}</Footer> : null}
      </Panel>
    </Overlay>,
    document.body
  );
}
