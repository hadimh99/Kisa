import { motion } from 'framer-motion';

// Presentational icons extracted from App.jsx (markup unchanged).

export const KisaLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 4V18.5C18 19.3284 17.3284 20 16.5 20H6.5C5.67157 20 5 19.3284 5 18.5V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.5 8.5L9.5 11L12.5 13.5L8.5 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// THE UPGRADED NATIVE ICON PHYSICS
// Automatically morphs to X on mount, and morphs back to Hamburger on exit.
export const AnimatedMenuIcon = ({ isOpen, className }) => (
  <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <motion.line x1="4" y1="9" x2="20" y2="9" initial={false} animate={isOpen ? { y1: 12, y2: 12, rotate: 45 } : { y1: 9, y2: 9, rotate: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "center" }} />
    <motion.line x1="4" y1="15" x2="20" y2="15" initial={false} animate={isOpen ? { y1: 12, y2: 12, rotate: -45 } : { y1: 15, y2: 15, rotate: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "center" }} />
  </motion.svg>
);
