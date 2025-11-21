"use client";
import styled from 'styled-components';
import React from 'react';

const Btn = styled.button`
  background: transparent;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid rgba(255,255,255,0.06);
  padding: 6px 10px;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 160ms ease;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover { background: rgba(255,255,255,0.02); transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 2px solid rgba(241,241,241,0.06); outline-offset: 2px; }

  @media (max-width: 600px) {
    font-size: 13px;
    padding: 5px 7px;
    gap: 6px;
  }
`;

export default function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // allow inline style overrides like background color
  const { style, children, ...rest } = props as any;
  return <Btn {...rest} style={style}>{children}</Btn>;
}
