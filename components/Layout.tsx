import React, { ReactNode } from 'react';
import { ViewState } from '../types';
import { Home, UserPlus, DollarSign, Dumbbell, Settings, Users, LogOut, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onLogout, darkMode, toggleTheme }) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 md:pl-64 transition-all duration-300`}>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 dark:bg-black text-white hidden md:flex flex-col z-50 shadow-xl border-r border-slate-800 dark:border-gray-800">
        <div className="p-6 flex items-center justify-between border-b border-slate-800 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/UP LOGO.png" alt="UP Fit Logo" className="h-16 object-contain" />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem
            icon={<Home size={20} />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Alunos"
            active={currentView === 'students'}
            onClick={() => onNavigate('students')}
          />
          <SidebarItem
            icon={<UserPlus size={20} />}
            label="Novo Aluno"
            active={currentView === 'new-student'}
            onClick={() => onNavigate('new-student')}
          />
          <SidebarItem
            icon={<DollarSign size={20} />}
            label="Financeiro"
            active={currentView === 'finance'}
            onClick={() => onNavigate('finance')}
          />
          <SidebarItem
            icon={<Settings size={20} />}
            label="Planos"
            active={currentView === 'plans'}
            onClick={() => onNavigate('plans')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 dark:border-gray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </div>

        <div className="p-4 text-xs text-slate-600 text-center">
          v1.0.0 &copy; 2025
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 dark:bg-black text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <img src="/UP LOGO.png" alt="UP Fit Logo" className="h-8 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <MobileNavItem
          icon={<Home size={24} />}
          label="Home"
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <MobileNavItem
          icon={<Users size={24} />}
          label="Alunos"
          active={currentView === 'students'}
          onClick={() => onNavigate('students')}
        />
        <div className="relative -top-5">
          <button
            onClick={() => onNavigate('new-student')}
            className="bg-upfit-orange text-white p-4 rounded-full shadow-lg hover:bg-orange-600 active:scale-95 transition-transform border-4 border-gray-50 dark:border-gray-900"
          >
            <UserPlus size={24} />
          </button>
        </div>
        <MobileNavItem
          icon={<DollarSign size={24} />}
          label="Finan"
          active={currentView === 'finance'}
          onClick={() => onNavigate('finance')}
        />
        <MobileNavItem
          icon={<Settings size={24} />}
          label="Planos"
          active={currentView === 'plans'}
          onClick={() => onNavigate('plans')}
        />
      </nav>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-upfit-orange text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:text-gray-400 dark:hover:bg-gray-800'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-upfit-orange' : 'text-gray-400 dark:text-gray-500'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Layout;