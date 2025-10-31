import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AdminLogin } from '../admin/components/AdminLogin';
import { AgentsDashboard } from './components/AgentsDashboard';
import { useAdminCheck } from '../admin/hooks/useAdminCheck';

function AgentsApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck(user);

  const isLoading = authLoading || adminCheckLoading;
  const isAuthenticated = !!user && isAdmin;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-light-base dark:bg-dark-base flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-light-text dark:text-dark-text">جاري التحميل...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AdminLogin key="login" />
        ) : (
          <AgentsDashboard key="dashboard" user={user!} />
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default AgentsApp;
