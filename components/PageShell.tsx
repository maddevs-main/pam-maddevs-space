"use client";
import React from 'react';
import styled from 'styled-components';
import Card from './ui/Card';

const Container = styled.div<{full?:boolean}>`
  max-width: ${p => p.full ? '100%' : '1100px'};
  margin: 0 auto;
  /* Uniform padding across main pages */
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  overflow-x: hidden;
`;

const Header = styled.header`
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  overflow-x: hidden;
`;

export const Title = styled.h1`
  /* Increased significantly per request (2x) */
  font-size: 80px;
  line-height: 1.02;
  margin: 0 0 10px 0;
  font-weight: 900;
  color: ${(p) => p.theme?.colors?.light || '#fff'};
  letter-spacing: -0.02em;
  @media (max-width: 1024px) {
    font-size: 56px;
  }
  @media (max-width: 640px) {
    font-size: 40px;
  }
`;

export const Subtitle = styled.p`
  margin: 0;
  color: rgba(180,180,178,0.9);
  font-size: 15px;
`;

const Content = styled.main`
  display: block;
  min-width: 0;
  overflow-x: hidden;
  /* slightly larger, uniform vertical spacing */
  > * + * { margin-top: 20px; }
`;

export default function PageShell({ title, subtitle, children, fullWidth = true, actions, preTitle }: { title?: string, subtitle?: string, children?: React.ReactNode, fullWidth?: boolean, actions?: React.ReactNode, preTitle?: React.ReactNode }) {
  return (
    <Container full={!!fullWidth}>
      {(title || subtitle || actions || preTitle) && (
        <Header>
          <div>
            {preTitle ? <div style={{ marginBottom: 8 }}>{preTitle}</div> : null}
            {title ? <Title>{title}</Title> : null}
            {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </Header>
      )}
      <Content>{children}</Content>
    </Container>
  );
}
