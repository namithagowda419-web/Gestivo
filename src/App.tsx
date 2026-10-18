import { useState, useRef, useEffect } from 'react';
import { EnchantedForestBackground } from './components/background/EnchantedForestBackground';
import { Sidebar } from './components/sidebar/Sidebar';
import { TopHeader } from './components/header/TopHeader';
import { HeroBanner } from './components/hero/HeroBanner';
import { QuickCommunicationCarousel } from './components/carousel/QuickCommunicationCarousel';
import { VoiceBar } from './components/voice/VoiceBar';
import { CommunicationBoardCard } from './components/board/CommunicationBoardCard';
import { QuickActionsCard } from './components/actions/QuickActionsCard';
import { RecentActivityCard } from './components/activity/RecentActivityCard';
import { MyProfileCard } from './components/profile/MyProfileCard';
import { CaregiverDashboardPanel } from './components/dashboard/CaregiverDashboardPanel';
import { HistoryPanel } from './components/history/HistoryPanel';
import { ProfileSettingsPanel } from './components/settings/ProfileSettingsPanel';
import { PlayLearnPanel } from './components/play/PlayLearnPanel';
import { MobilePreviewMockup } from './components/mobile/MobilePreviewMockup';
import { FeatureStrip } from './components/footer/FeatureStrip';

// Cue Camera Feature
import { CueCameraView } from './components/cues/CueCameraView';
import { CueCameraErrorBoundary } from './components/cues/CueCameraErrorBoundary';
import { GlobalDebugHUD } from './components/common/GlobalDebugHUD';

// Interactive Modals
import { MemoryGameModal } from './components/modals/MemoryGameModal';
import { ShapeMatchModal } from './components/modals/ShapeMatchModal';
import { AnimalSoundsModal } from './components/modals/AnimalSoundsModal';
import { StoryTimeModal } from './components/modals/StoryTimeModal';
import { SetReminderModal } from './components/modals/SetReminderModal';
import { ManageGoalsModal } from './components/modals/ManageGoalsModal';
import { AddCustomTileModal } from './components/modals/AddCustomTileModal';
import { DemoWelcomeModal } from './components/modals/DemoWelcomeModal';

// Auth
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { useGestivoStore } from './store/useGestivoStore';
import { playChime } from './utils/speech';

export function App() {
  const { session } = useAuthStore();
  const { activeModal, setActiveModal } = useGestivoStore();

  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/cue-camera' || path === '/camera' || path.startsWith('/cue-camera')) {
        return 'cue-camera';
      }
    }
    return 'home';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Section references for smooth scrolling when sidebar is tapped
  const heroRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const caregiverRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/cue-camera' || path === '/camera' || path.startsWith('/cue-camera')) {
        setCurrentView('cue-camera');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);

    if (view === 'cue-camera') {
      if (window.location.pathname !== '/cue-camera') {
        window.history.pushState({}, '', '/cue-camera');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (window.location.pathname === '/cue-camera') {
      window.history.pushState({}, '', '/');
    }

    if (view === 'home' || view === 'child') {
      heroRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'board') {
      boardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'history') {
      historyRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'profile' || view === 'settings') {
      profileRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'caregiver') {
      caregiverRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'play') {
      playRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If user is not logged in, show the Login Page
  if (!session.isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white font-nunito">
      {/* 1. Enchanted Glowing Forest Background (heavy animations pause when camera view is active) */}
      <EnchantedForestBackground isPaused={currentView === 'cue-camera'} />

      {/* 2. Left Sidebar (Fixed on desktop, drawer on mobile) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 3. Main Content Container */}
      <div className="relative z-10 lg:pl-72 w-full flex-1 flex flex-col justify-between">
        <main className="w-full max-w-[1720px] mx-auto p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Top Header with live date/time, Little Explorer greeting, and AAC sentence strip */}
          <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

          {/* Conditional Screen View: Cue Camera vs Main AAC Dashboard */}
          {currentView === 'cue-camera' ? (
            <div className="w-full">
              <CueCameraErrorBoundary onSwitchToBoard={() => handleNavigate('board')}>
                <CueCameraView onNavigateToBoard={() => handleNavigate('board')} />
              </CueCameraErrorBoundary>
            </div>
          ) : (
            <>
              {/* MAIN COLLAGE SECTION: Center Hero + Right Column Cards */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
                {/* Left & Center Hero Area (7 cols on desktop) */}
                <div ref={heroRef} className="xl:col-span-7 space-y-5 sm:space-y-6">
                  {/* Hero Banner with kids-with-pets illustration and Explore & Play ribbon */}
                  <HeroBanner
                    onExploreClick={() => {
                      playChime('star');
                      setActiveModal('memoryGame');
                    }}
                  />

                  {/* Main Quick-Communication Carousel: 6 Chunky 3D Buttons */}
                  <QuickCommunicationCarousel />

                  {/* Voice Bar: Microphone pill + Animated waveform + Voice Output toggle + Nimo mascot */}
                  <VoiceBar />
                </div>

                {/* Right Column: Communication Board + Quick Actions + Recent Activity + Profile (5 cols on desktop) */}
                <div className="xl:col-span-5 space-y-5 sm:space-y-6">
                  {/* Top Row of Right Column: Communication Board */}
                  <div ref={boardRef} className="grid grid-cols-1 lg:grid-cols-1 gap-5">
                    {/* Communication Board Card (pastel, girl avatar, 4x3 grid) */}
                    <CommunicationBoardCard />
                  </div>

                  {/* Quick Actions Panel */}
                  <QuickActionsCard onNavigate={handleNavigate} />

                  {/* Bottom Row of Right Column: Recent Activity + My Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Recent Activity Card (live entries) */}
                    <RecentActivityCard
                      onViewAll={() => {
                        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />

                    {/* My Profile Card (Aarvi, badges, chips) */}
                    <MyProfileCard
                      onOpenSettings={() => {
                        profileRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW — 5 PANELS PLUS MOBILE PREVIEW */}
              <section className="pt-4 border-t border-white/15 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-wide">
                      Explorer Hub &amp; Modules
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-cyan-200">
                      Comprehensive tools for child engagement and caregiver tracking
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-purple-200 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>All Modules Active</span>
                  </div>
                </div>

                {/* Responsive grid for bottom row: 3 columns on ultra-wide, 2 on tablet, 1 on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-6">
                  {/* a) Caregiver Dashboard */}
                  <div ref={caregiverRef} className="h-full">
                    <CaregiverDashboardPanel isStandalone={false} />
                  </div>

                  {/* b) History Panel */}
                  <div ref={historyRef} className="h-full">
                    <HistoryPanel />
                  </div>

                  {/* c) Profile & Settings Panel */}
                  <div ref={profileRef} className="h-full">
                    <ProfileSettingsPanel />
                  </div>

                  {/* d) Play & Learn Panel */}
                  <div ref={playRef} className="h-full">
                    <PlayLearnPanel />
                  </div>

                  {/* e) Mobile Responsive View Mockup */}
                  <div className="h-full 2xl:col-span-2">
                    <MobilePreviewMockup />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* 11. Footer Strip: More Than an App... with 5 Highlights and Sticky Note */}
        <FeatureStrip />
      </div>

      {/* Interactive Feature Modals */}
      <MemoryGameModal />
      <ShapeMatchModal />
      <AnimalSoundsModal />
      <StoryTimeModal />
      <SetReminderModal />
      <ManageGoalsModal />
      <AddCustomTileModal
        isOpen={activeModal === 'addCustomTile'}
        onClose={() => setActiveModal(null)}
      />

      {/* Demo Welcome Modal with Pink Cat Mascot */}
      <DemoWelcomeModal />

      {/* Global Real-Time Debug HUD (accessible via ?debug=1) */}
      <GlobalDebugHUD currentView={currentView} />
    </div>
  );
}

export default App;
