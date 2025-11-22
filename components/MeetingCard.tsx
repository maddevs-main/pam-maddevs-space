"use client";
import React from 'react';
import styled from 'styled-components';

type Meeting = {
  _id?: string | number;
  id?: number;
  title?: string;
  date?: string;
  time?: string;
  participants?: string[];
  link?: string;
  requestedBy?: string | { id?: string; name?: string };
  status?: string;
};

const Container = styled.div`
  border-radius: 12px;
  overflow: hidden;
  transition: all 200ms ease;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  box-sizing: border-box;
  /* Match project tile dimensions for visual consistency */
  height: 110px;
  min-height: 110px;
  max-height: 110px;
  @media (max-width: 800px) {
    height: 80px;
    min-height: 80px;
    max-height: 80px;
  }
`;

const Shell = styled.div`
  display: grid;
  grid-template-columns: 1fr minmax(80px, 120px);
  border-radius: 12px;
  overflow: hidden;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 100%;
  @media (max-width: 800px) {
    grid-template-columns: 1fr 70px;
  }
`;

const Left = styled.div`
  background: #ffffff39;
  padding: 12px 16px;
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.04);
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 100%;
  @media (max-width: 800px) {
    padding: 8px 6px;
  }
`;

const Right = styled.div<{ $shellBg?: string }>`
  background: ${p => p.$shellBg || 'var(--tile-bg)'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  min-width: 80px;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 100%;
  @media (max-width: 800px) {
    min-width: 60px;
    padding: 4px;
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  height: 100%;
  @media(min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  @media (max-width: 800px) {
    gap: 6px;
  }
`;

const MainInfo = styled.div`
  flex: 1 1 auto;
  margin-bottom: 8px;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  @media(min-width: 640px) { margin-bottom: 0; }
  @media (max-width: 800px) {
    margin-bottom: 0;
  }
`;

const Title = styled.h3`
  margin: 0 0 6px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  /* allow titles to wrap to two lines and then ellipsize */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  max-width: 100%;
  word-break: break-word;
  @media (max-width: 800px) {
    font-size: 0.95rem;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.9);
  align-items: center;
  @media (max-width: 800px) {
    gap: 6px 10px;
    font-size: 0.85rem;
  }
  & > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
`;

const IdText = styled.div`
  font-size: 0.8rem;
  color: rgba(255,255,255,0.85);
  opacity: 0.95;
  @media (max-width: 800px) {
    display: none;
  }
`;

const StatusWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const StatusText = styled.span`
  font-weight: 700;
  color: #ffffff;
  writing-mode: horizontal-tb;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
  width: 100%;
  box-sizing: border-box;
`;

export function statusColors(status?: string) {
  const s = (status || '').toString().trim().toLowerCase();
  switch (s) {
    case 'upcoming':
    case 'approved':
    case 'ongoing':
    case 'in progress':
      return { shell: '#526452', panel: 'rgba(var(--color-yes-rgb),0.08)', color: '#ffffff' };
    case 'requested':
    case 'pending':
      return { shell: '#CFCD88', panel: 'rgba(var(--color-pending-rgb),0.08)', color: '#ffffff' };
    case 'declined':
    case 'rejected':
    case 'urgent':
      return { shell: '#865555', panel: 'rgba(var(--color-no-rgb),0.08)', color: '#ffffff' };
    case 'finished':
    case 'completed':
    case 'done':
      return { shell: '#6b7280', panel: '#f3f4f6', color: '#374151' };
    case 'in-review':
    case 'review':
      return { shell: '#3D404C', panel: 'rgba(var(--color-dark-rgb),0.08)', color: '#ffffff' };
    default:
      return { shell: '#9ca3af', panel: '#eef2f6', color: '#374151' };
  }
}

export type TileProps = {
  meeting?: Meeting;
  title?: string;
  _id?: string | number;
  id?: number;
  date?: string;
  time?: string;
  requestedBy?: string | { id?: string; name?: string };
  link?: string;
  status?: string;
  onClick?: () => void;
  panelColor?: string;
  active?: string;
  rightAction?: React.ReactNode;
};

export default function MeetingCard(props: TileProps) {
  const { meeting } = props;
  const title = meeting?.title || props.title || 'Untitled';
  const itemId = meeting?._id || meeting?.id || props._id || props.id;
  const date = meeting?.date || props.date || '';
  const time = meeting?.time || props.time || '';
  const requestedBy = meeting?.requestedBy || props.requestedBy || undefined;
  const link = meeting?.link || props.link || undefined;
  const status = (props.active as string) || meeting?.status || props.status;
  const colors = statusColors(status);
  const shellColor = props.panelColor || colors.shell;

  return (
    <Container onClick={props.onClick} style={{ cursor: props.onClick ? 'pointer' : 'default' }}>
      <Shell>
        <Left>
          <Inner>
            <MainInfo>
              <Title>{title}</Title>
              {itemId ? <IdText>Meeting ID: {itemId}</IdText> : null}
              <MetaRow>
                <div title="Schedule" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{date} at {time}</span>
                </div>
                <div title="Requested by" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Requested by: <strong style={{ marginLeft: 6 }}>{typeof requestedBy === 'string' ? requestedBy : (requestedBy?.name || requestedBy?.id || '—')}</strong>
                </div>
                {link ? (<div><a href={link} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.95)', textDecoration: 'underline' }}>Link</a></div>) : null}
              </MetaRow>
            </MainInfo>
          </Inner>
        </Left>

        <Right $shellBg={shellColor}>
          <StatusWrap>
            {props.rightAction ? (
              props.rightAction
            ) : (
              <StatusText title={String(status || '—')}>{(status || '—').toString()}</StatusText>
            )}
          </StatusWrap>
        </Right>
      </Shell>
    </Container>
  );
}
