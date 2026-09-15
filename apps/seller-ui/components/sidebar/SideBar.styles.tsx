'use client';
import styled from 'styled-components';

interface SidebarWrapperProps {
  collapsed?: boolean;
}

// SidebarWrapper component
export const SidebarWrapper = styled.div<SidebarWrapperProps>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  position: fixed;
  top: 0;
  bottom: 0;
  height: 100vh;
  width: 17rem; /* Slightly wider to give breathing room */
  flex-shrink: 0;
  z-index: 202;
  overflow: hidden;
  border-right: 1px solid var(--border);

  /* Set uniform side padding directly on the outer wrapper */
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 1.25rem; /* Explicit left spacing for everything */
  padding-right: 1.25rem;

  transition: transform 0.2s ease;
  transform: translateX(-100%);

  @media (min-width: 768px) {
    margin-left: 0;
    display: flex;
    position: static;
    height: 100vh;
    transform: translateX(0);
  }

  ${(props) =>
    props.collapsed &&
    `
    display: inherit;
    margin-left: 0;
    transform: translateX(0);
  `}
`;

// Overlay component
export const Overlay = styled.div`
  background-color: rgba(15, 23, 42, 0.3);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 201;
  transition: opacity 0.3s ease;
  opacity: 0.8;

  @media (min-width: 768px) {
    display: none;
    z-index: auto;
    opacity: 1;
  }
`;

// Header component
export const Header = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  width: 100%;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0;
`;

// Body component
export const Body = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;

  gap: 0.2rem;

  /* Reset internal padding since wrapper handles the side spacing now */
  padding-left: 0;
  padding-right: 0;

  ::-webkit-scrollbar {
    display: none;
  }
`;

// Footer component
export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: start; /* Align to the left to match menus */
  margin-top: auto;
  width: 100%;

  /* Clear heavy padding that caused the overlap */
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  padding-left: 0;
  padding-right: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08); /* Clean separator line */
`;

export const Sidebar = {
  Wrapper: SidebarWrapper,
  Header,
  Body,
  Overlay,
  Footer,
};
