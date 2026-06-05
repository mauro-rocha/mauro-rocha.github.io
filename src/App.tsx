import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { DataProvider } from './context/DataContext';

const Home = React.lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const WorkDetail = React.lazy(() => import('./pages/WorkDetail').then((m) => ({ default: m.WorkDetail })));
const Admin = React.lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
const Background3D = React.lazy(() => import('./components/Background3D').then((m) => ({ default: m.Background3D })));
const AIChat = React.lazy(() => import('./components/AIChat').then((m) => ({ default: m.AIChat })));
const NotFound = React.lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Scroll to top wrapper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [enableFX, setEnableFX] = React.useState(false);
  const [enableAI, setEnableAI] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as any).connection?.saveData;
    if (prefersReducedMotion || saveData) return;

    let timeoutId: number | null = null;
    const requestIdle = (window as any).requestIdleCallback as ((cb: any, opts?: any) => number) | undefined;
    const cancelIdle = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;

    if (requestIdle) {
      const idleId = requestIdle(() => {
        setEnableFX(true);
      }, { timeout: 2000 });
      return () => cancelIdle?.(idleId);
    }

    timeoutId = window.setTimeout(() => {
      setEnableFX(true);
    }, 1500);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as any).connection?.saveData;
    if (prefersReducedMotion || saveData) return;

    let timeoutId: number | null = null;
    let enabled = false;

    const removeListeners = () => {
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('scroll', onInteraction);
    };

    const enable = () => {
      if (enabled) return;
      enabled = true;
      setEnableAI(true);
      removeListeners();
    };

    const onInteraction = () => {
      enable();
    };

    window.addEventListener('pointerdown', onInteraction, { passive: true });
    window.addEventListener('touchstart', onInteraction, { passive: true });
    window.addEventListener('keydown', onInteraction);
    window.addEventListener('scroll', onInteraction, { passive: true });

    timeoutId = window.setTimeout(enable, isMobile ? 7000 : 3500);

    return () => {
      removeListeners();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isMobile]);

  return (
    <DataProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="relative min-h-screen bg-transparent text-primary selection:bg-white selection:text-black">
          <ScrollToTop />
          {!isMobile && <CustomCursor />}

          {enableFX && !isMobile && (
            <Suspense fallback={null}>
              <Background3D />
            </Suspense>
          )}
          <Header />

          <main className="relative z-10">
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/work/:id" element={<WorkDetail />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

          {enableAI && (
            <Suspense fallback={null}>
              <AIChat />
            </Suspense>
          )}

          <SpeedInsights />
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
