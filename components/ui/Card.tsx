"use client";
import styled from 'styled-components';
import React from 'react';

const CardWrap = styled.article<{ $classic?: boolean }>`
  background: #f8f8f823;
  color: ${(p:any) => p.$classic ? 'inherit' : '#f8f8f8'};
  border: ${(p:any) => p.$classic ? `1px solid rgba(${(p && p.theme && p.theme.colors && p.theme.colors.lightRgb ? p.theme.colors.lightRgb.replace('rgb(', '').replace(')', '') : '241,241,241')}, 0.06)` : '1px solid rgba(255, 255, 255, 0)'};
  padding: 8px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  overflow-wrap: anywhere;
  font-size: 15px;
  border-radius: ${(p:any) => p.$classic ? '8px' : '12px'};
  box-shadow: ${(p:any) => p.$classic ? '0 1px 0 rgba(0,0,0,0.12)' : '0 2px 10px rgba(0,0,0,0.06)'};
  overflow: hidden;
  position: relative;
  @media (min-width: 600px) {
    padding: 16px;
    font-size: 16px;
  }
`;

type CardProps = React.ComponentProps<'article'> & { classic?: boolean };

export default function Card({ children, classic, ...props }: CardProps) {
  return <CardWrap $classic={!!classic} {...props}>{children}</CardWrap>;
}
