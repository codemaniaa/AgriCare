// src/pages/landing/index.jsx
// ──────────────────────────────────────────────────────────────────
// DROP-IN ENTRY POINT for the AgriCare landing + intro module.
//
// HOW TO USE IN YOUR EXISTING App.jsx:
//
//   import LandingEntry from './pages/landing';
//
//   <Route path="/" element={<LandingEntry />} />
//
// That's it. No other changes needed.
// ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import IntroAnimation from './IntroAnimation';
import HomePage from '../HomePage'; // adjust path if needed
 
const STORAGE_KEY     = 'agricare_intro_done';
const SESSION_KEY     = 'agricare_intro_session';

export default function LandingEntry() {
  // Show intro once per session, or every time if no session flag.
  // Remove the sessionStorage logic to always show intro on every visit.
  const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';
  const [showIntro, setShowIntro] = useState(!alreadySeen);
  const [landing,   setLanding]   = useState(alreadySeen);

  const handleIntroComplete = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShowIntro(false);
    // Small delay so IntroAnimation's own exit animation runs first
    setTimeout(() => setLanding(true), 100);
  };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      {landing   && <HomePage />}
    </>
  );
}
