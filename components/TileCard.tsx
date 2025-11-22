"use client";
import React from 'react';
import styled from 'styled-components';

type Meeting = {
  _id?: string | number;
  id?: number;
  title?: string;
  date?: string;
  time?: string;
  timelineRange?: string;
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
  box-sizing: border-box;
  height: 110px;
  min-height: 110px;
  max-height: 110px;
  display: flex;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  &:focus-visible { outline: 3px solid rgba(98, 99, 175, 0.18); outline-offset: 3px; }

  @media (max-width: 800px) {
    height: 80px;
    min-height: 80px;
    max-height: 80px;
    padding: 0;
  }
`;

const Shell = styled.div`
  display: grid;
  grid-template-columns: 1fr minmax(80px, 120px);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;

  @media (max-width: 800px) {
    grid-template-columns: 1fr 70px;
  }
`;

const Left = styled.div`
  background: #ffffff3b;
  padding: 12px 16px;
  position: relative; /* allow absolutely positioned top-right amounts inside */
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.04);
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;

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
  height: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;

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
  margin-left: 12px;
  /* reserve space on the right for top-right amount block */
  padding-right: 160px;
  overflow: hidden;
  /* allow up to two lines and then truncate with ellipsis for long titles */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  max-width: 100%;
  word-break: break-word;
  @media (max-width: 800px) {
    font-size: 0.95rem;
    margin-left: 6px;
    padding-right: 100px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.9);
  align-items: center;
  /* ensure child items truncate instead of forcing layout expansion */
  & > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
`;

const TimelineText = styled.div`
  margin-top: 6px;
  color: rgba(180,180,178,0.75);
  font-size: 13px;
  @media (max-width: 800px) {
    font-size: 12px;
  }
`;

const ProgressText = styled.div`
  margin-top: 6px;
  color: rgba(180,180,178,0.9);
  font-size: 13px;
  @media (max-width: 800px) {
    font-size: 12px;
  }
`;

// Meeting ID is intentionally not shown on the tile; dialogs will display it.

const StatusWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const StatusText = styled.span<{ $textColor?: string }>`
  font-weight: 700;
  color: ${p => p.$textColor || '#ffffff'};
  writing-mode: horizontal-tb;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
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

function parseColorToRgb(color?: string) {
  if (!color) return null;
  let c = color.toString().trim();
  // Resolve CSS var(...) if present
  if (c.startsWith('var(')) {
    try {
      const varName = c.slice(c.indexOf('(') + 1, c.lastIndexOf(')')).trim();
      if (typeof window !== 'undefined') {
        const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (v) c = v;
      }
    } catch (e) {}
  }

  // Hex (#fff or #ffffff)
  if (c.startsWith('#')) {
    const h = c.replace('#', '');
    const full = h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h;
    const bigint = parseInt(full, 16);
    if (Number.isNaN(bigint)) return null;
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  // rgb(...) or rgba(...)
  const rgbMatch = c.match(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)/i);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1], 10), g: parseInt(rgbMatch[2], 10), b: parseInt(rgbMatch[3], 10) };
  }

  return null;
}

function luminanceOfColor(color?: string) {
  const rgb = parseColorToRgb(color) || { r: 255, g: 255, b: 255 };
  const [R, G, B] = [rgb.r, rgb.g, rgb.b].map(v => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
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
  leftContent?: React.ReactNode;
  children?: React.ReactNode;
  /** For project tiles: a single stage or overall progress value (0-100) */
  progress?: number;
  /** When showing average progress across stages */
  avgProgress?: number;
  /** number of stages when avgProgress is provided */
  stagesCount?: number;
  /** explicit timeline string to show under the title */
  timeline?: string;
  hideMeta?: boolean;
  ariaLabel?: string;
};

export default function TileCard(props: TileProps) {
  const { meeting } = props;
  const title = meeting?.title || props.title || 'Untitled';
  const date = meeting?.date || props.date || '';
  const time = meeting?.time || props.time || '';
  const timeline = props.timeline || meeting?.timelineRange;
  const requestedBy = meeting?.requestedBy || props.requestedBy || undefined;
  const link = meeting?.link || props.link || undefined;
  const status = (props.active as string) || meeting?.status || props.status;
  const colors = statusColors(status);
  const shellColor = props.panelColor || colors.shell;
  const lum = luminanceOfColor(shellColor || '#ffffff');
  const textColor = lum > 0.5 ? '#000000' : '#ffffff';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!props.onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      props.onClick();
    }
  };

  return (
    <Container
      onClick={props.onClick}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : -1}
      onKeyDown={handleKeyDown}
      aria-label={props.ariaLabel || title}
      style={{ cursor: props.onClick ? 'pointer' : 'default' }}
    >
      <Shell>
        <Left>
          <Inner>
            <MainInfo>
              <Title>{title}</Title>
              {/* Timeline row (compact) */}
              {timeline ? <TimelineText>{timeline}</TimelineText> : null}

              {/* Progress area: prefer explicit props, otherwise allow children to supply custom content */}
              {(props.avgProgress !== undefined || props.progress !== undefined) ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 999, overflow: 'hidden' }}>
                    {
                      (() => {
                        const val = props.avgProgress !== undefined ? Number(props.avgProgress || 0) : Number(props.progress || 0);
                        // Choose fill color according to spec: 0 -> pending (yellow), 1-99 -> yes (green), 100 -> dark/grey
                        let fill: string;
                        if (val >= 100) fill = 'var(--color-dark)';
                        else if (val <= 0) fill = 'var(--color-pending)';
                        else if (val > 50) fill = 'linear-gradient(90deg,var(--color-yes),var(--color-dark))';
                        else fill = 'var(--color-yes)';
                        const width = Math.max(0, Math.min(100, val));
                        return (<div style={{ height: '100%', width: `${width}%`, background: fill, transition: 'width 300ms ease' }} />);
                      })()
                    }
                  </div>
                  <ProgressText>
                    {props.avgProgress !== undefined ? `${props.avgProgress}% average across ${props.stagesCount || '–'} stages` : `${props.progress}%`}
                  </ProgressText>
                </div>
              ) : (
                // fallback to existing children/leftContent for non-project cards
                <>
                  {props.leftContent ? <div style={{ marginTop: 8 }}>{props.leftContent}</div> : null}
                              {props.children ? <div style={{ marginTop: 8 }}>{props.children}</div> : null}
                </>
              )}
            </MainInfo>
          </Inner>
        </Left>

        <Right $shellBg={shellColor}>
          <StatusWrap>
            {props.rightAction ? (
              props.rightAction
            ) : (
              <StatusText $textColor={textColor} title={String(status || '—')}>{(status || '—').toString()}</StatusText>
            )}
          </StatusWrap>
        </Right>
      </Shell>
    </Container>
  );
}
