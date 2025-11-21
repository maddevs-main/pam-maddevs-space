"use client";
import React from 'react';
import styled from 'styled-components';

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const Button = styled.button`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(180,180,178,0.04);
  color: inherit;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
`;

const Editor = styled.div`
  background: transparent;
  color: ${(p:any) => (p && p.theme && p.theme.colors && p.theme.colors.light) || '#F1F1F1'};
  border: 1px solid rgba(180,180,178,0.08);
  padding: 8px 10px;
  border-radius: 6px;
  min-height: 120px;
  font-size: 16px;
  outline: none;
`;

export default function RichTextEditor({ value, onChange, placeholder }:{ value?: string, onChange?: (html:string)=>void, placeholder?: string }){
  const ref = React.useRef<HTMLDivElement|null>(null);

  React.useEffect(()=>{
    if (ref.current && value !== undefined && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    triggerChange();
  }

  function triggerChange(){
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    onChange && onChange(html);
  }

  function handleInput(){ triggerChange(); }

  return (
    <div>
      <Toolbar>
        <Button type="button" onClick={() => exec('bold')}>B</Button>
        <Button type="button" onClick={() => exec('italic')}>I</Button>
        <Button type="button" onClick={() => exec('insertUnorderedList')}>• List</Button>
        <Button type="button" onClick={() => exec('insertOrderedList')}>1. List</Button>
        <Button type="button" onClick={() => exec('createLink', prompt('Enter URL') || '')}>Link</Button>
      </Toolbar>
      <Editor
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || ''}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
