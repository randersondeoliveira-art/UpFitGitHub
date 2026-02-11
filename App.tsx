import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import Finance from './components/Finance';
import Plans from './components/Plans';
import Students from './components/Students';
import Login from './components/Login';
import { ViewState, Student } from './types';
import { supabase } from './services/supabase';
import { logout } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setCheckingAuth(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) setCurrentView('dashboard'); // Reset view on logout
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    // Login is handled inside Login.tsx which calls API, 
    // and onAuthStateChange will update state here.
    // We can just set view to dashboard.
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    // onAuthStateChange will handle state update
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'new-student':
        return (
          <StudentForm
            onSuccess={() => {
              setCurrentView('dashboard');
              setStudentToEdit(null);
            }}
            initialData={studentToEdit}
          />
        );
      case 'finance':
        return <Finance />;
      case 'plans':
        return <Plans />;
      case 'students':
        return (
          <Students
            onEditStudent={(student) => {
              setStudentToEdit(student);
              setCurrentView('new-student');
            }}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Carregando...</div>;
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
}

export default App;