import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Sparkles, 
  Settings, 
  LogOut,
  Search,
  User as UserIcon,
  PlusCircle,
  BarChart3,
  BellRing,
  FolderOpen,
  Gem,
  Mail} from 'lucide-react';
import { LotusLogo } from './Icons';
import { BackButton } from './UI';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { NotificationBell } from './NotificationBell';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
}> = ({ to, icon, label, active }) => (
  <Link to={to}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-rose text-white shadow-md' : 'text-gray-400 hover:text-rose hover:bg-rose hover:bg-opacity-5'}`}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
  </Link>
);

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, firebaseUser } = useAuth();
  const userRole = currentUser?.role;

  const isSuperAdmin = userRole === Role.SUPERADMIN;
  const isAdmin = userRole === Role.ADMIN;

  const adminMenu = [
    { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { to: '/dashboard/create-event', label: 'Create Event', icon: <PlusCircle size={18} /> },
    { to: '/dashboard/manage-events', label: 'Manage Events', icon: <Calendar size={18} /> },
    { to: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { to: '/dashboard/hidden-gems', label: 'Hidden Gems', icon: <Gem size={18} /> },
    { to: '/dashboard/announcements', label: 'Announcements', icon: <BellRing size={18} /> },
  ];

  const participantMenu = [
    { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { to: '/dashboard/browse', label: 'Browse Events', icon: <Calendar size={18} /> },
    { to: '/dashboard/my-events', label: 'My Events', icon: <FolderOpen size={18} /> },
    { to: '/dashboard/lotus-match', label: 'LotUs Match', icon: <Sparkles size={18} /> },
    { to: '/dashboard/connections', label: 'Teams', icon: <Users size={18} /> },
    { to: '/dashboard/messages', label: 'Messages', icon: <Mail size={18} /> },
    { to: '/dashboard/announcements', label: 'Announcements', icon: <BellRing size={18} /> },
  ];

  const currentMenu = (isSuperAdmin || isAdmin) ? adminMenu : participantMenu;
  const roleLabel = isSuperAdmin ? '👑 Super Admin' : userRole;

  const handleLogout = () => {
    import('../services/auth').then(({ logOut }) => {
      logOut().then(() => navigate('/'));
    });
  };

  return (
    <div className="flex min-h-screen bg-charcoal font-sans text-cream overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 bottom-0 border-r border-gray-800 bg-charcoal p-6 z-30">
        <div className="mb-10 flex flex-col items-start gap-1">
          <Link to="/" className="flex items-center gap-2 group">
            <LotusLogo className="text-rose group-hover:rotate-12 transition-transform duration-500" size={36} />
            <h1 className="text-2xl font-serif font-bold tracking-tight">LotUs</h1>
          </Link>
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-rose text-white'}`}>
              {roleLabel}
            </span>
            <p className="text-[10px] text-gray-500 font-medium">Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {currentMenu.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
          <div className="pt-4 border-t border-gray-800 mt-4">
            <SidebarItem 
              to="/dashboard/settings" 
              label="Settings" 
              icon={<Settings size={18} />} 
              active={location.pathname === '/dashboard/settings'} 
            />
          </div>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-white transition-all mt-auto"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-h-screen max-w-full overflow-x-hidden">
        <header className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <BackButton className="hidden sm:flex" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search events, teams..." 
                className="w-full pl-12 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-full focus:ring-2 focus:ring-rose outline-none text-sm transition-all" 
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div 
              className="flex items-center gap-3 pl-4 border-l border-gray-800 cursor-pointer" 
              onClick={() => navigate('/dashboard/profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">{isSuperAdmin ? '👑 Super Admin' : currentUser?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-rose border-opacity-30 bg-cream-pink flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <UserIcon className="text-rose" size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};