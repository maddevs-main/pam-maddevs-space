"use client";
import styled from 'styled-components';
import React from 'react';

export const TextInput = styled.input`
  background: transparent;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid var(--dialog-input-border, rgba(180,180,178,0.08));
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 16px;
  &:focus-visible { outline: 2px solid var(--dialog-input-focus, rgba(241,241,241,0.08)); }
`;

export const TextArea = styled.textarea`
  background: transparent;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid var(--dialog-input-border, rgba(180,180,178,0.08));
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 16px;
  min-height: 100px;
  &:focus-visible { outline: 2px solid var(--dialog-input-focus, rgba(241,241,241,0.08)); }
`;

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput {...props} />;
}
