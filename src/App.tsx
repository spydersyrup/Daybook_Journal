import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ThreatModelModal } from './components/ThreatModelModal';
import type { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    const isDemo = typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).get('demo') === 'true' ||
      window.location.hash.includes('demo')
    );

    if (isDemo) {
      setUser({
        uid: 'demo-user',
        email: 'arjun@daybook.internal',
        displayName: 'Arjun Sharma',
        photoURL: undefined,
      });
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSignInError(null);
    try {
      setAuthLoading(true);
      const profile = await signInWithGoogle();
      setUser(profile);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setSignInError('Sign-in was closed before completing authentication.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (err.code === 'auth/unauthorized-domain') {
        setSignInError(`Domain not authorized in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setSignInError('Google sign-in is not enabled in Firebase Console > Authentication > Sign-in method.');
      } else {
        setSignInError(err.message || 'Sign-in could not be completed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsFocusMode(false);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#0c0a09] text-stone-100 font-sans selection:bg-[#d6b889]/20 selection:text-[#f5f0eb]">
      {!isFocusMode && (
        <Navbar
          user={user}
          onSignOut={handleSignOut}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
      )}

      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-[#0c0a09]">
          <div className="h-5 w-5 rounded-full border-2 border-[#d6b889] border-t-transparent animate-spin" />
          <p className="text-xs text-stone-500 font-serif-editor italic">Loading Daybook...</p>
        </div>
      ) : user ? (
        <Dashboard
          user={user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        />
      ) : (
        <LandingPage
          onSignIn={handleSignIn}
          loading={authLoading}
          error={signInError}
          onOpenThreatModel={() => setIsThreatModelOpen(true)}
        />
      )}

      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />
    </div>
  );
}
