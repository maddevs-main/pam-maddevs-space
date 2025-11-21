"use client";
import styled from 'styled-components';
import React from 'react';

export const TextInput = styled.input`
  background: #323232ff;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid var(--dialog-input-border, rgba(180,180,178,0.08));
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: pre-line;
  line-height: 1.2;
  &:focus-visible { outline: 2px solid var(--dialog-input-focus, rgba(241,241,241,0.08)); }
  @media (max-width: 900px) {
    font-size: 15px;
    padding: 7px 8px;
  }
  @media (max-width: 600px) {
    font-size: 14px;
    padding: 6px 6px;
    line-height: 1.1;
  }
`;

export const TextArea = styled.textarea`
  background: #323232ff;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid var(--dialog-input-border, rgba(180,180,178,0.08));
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 16px;
  min-height: 100px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: pre-line;
  line-height: 1.2;
  resize: vertical;
  &:focus-visible { outline: 2px solid var(--dialog-input-focus, rgba(241,241,241,0.08)); }
  @media (max-width: 900px) {
    font-size: 15px;
    padding: 7px 8px;
    min-height: 80px;
  }
  @media (max-width: 600px) {
    font-size: 14px;
    padding: 6px 6px;
    min-height: 60px;
    line-height: 1.1;
  }
`;

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput {...props} />;
}
