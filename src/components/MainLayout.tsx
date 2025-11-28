import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Layout as LayoutIcon, Play, List, Settings, 
  FlaskConical, ChevronLeft, ChevronRight,
  Save, Loader2, ArrowLeft 
} from 'lucide-react';
import { Toaster } from 'sonner';
import clsx from 'clsx';

interface MainLayoutProps {
  children?: React.ReactNode;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  onSave?: () => void;
  loading?: boolean;
  currentScenarioName?: string | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed,
  onSave,
  loading,
  currentScenarioName
}) => {
  const location = useLocation();
  const isEditor = location.pathname === '/';
  const isSimulation = location.pathname === '/simulation';
  const isScenarios = location.pathname === '/scenarios';
  const isConfig = location.pathname === '/config';

  const SidebarItem = ({ icon: Icon, label, to, active }: any) => (
    <Link
      to={to}
      title={isSidebarCollapsed ? label : undefined}
      className={clsx(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer relative group",
        active 
          ? "text-white bg-gray-800 border-r-2 border-green-500" 
          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
      )}
    >
      <Icon className={clsx("flex-shrink-0", isSidebarCollapsed ? "w-6 h-6 mx-auto" : "w-5 h-5")} />
      
      {!isSidebarCollapsed && (
          <span>{label}</span>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Sidebar */}
      <aside 
        className={clsx(
            "bg-gray-900 text-white flex flex-col flex-shrink-0 border-r border-gray-800 transition-all duration-300",
            isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={clsx(
            "p-4 border-b border-gray-800 flex items-center",
            isSidebarCollapsed ? "justify-center" : "justify-between px-6"
        )}>
            <div className="flex items-center gap-2 text-green-500 font-bold text-xl overflow-hidden">
                <FlaskConical className="w-6 h-6 flex-shrink-0" />
                {!isSidebarCollapsed && <span>SimStudio</span>}
            </div>
            
            {!isSidebarCollapsed && (
                <button 
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            )}
        </div>

        <nav className="flex-1 py-4 space-y-1">
            <SidebarItem 
                icon={LayoutIcon} 
                label="Scenario Editor" 
                to="/" 
                active={isEditor} 
            />
            <SidebarItem 
                icon={Play} 
                label="Run Simulation" 
                to="/simulation" 
                active={isSimulation} 
            />
            <SidebarItem 
                icon={List} 
                label="Saved Scenarios" 
                to="/scenarios" 
                active={isScenarios} 
            />
            <SidebarItem 
                icon={Settings} 
                label="Configuration" 
                to="/config" 
                active={isConfig} 
            />
        </nav>

        <div className={clsx(
            "p-4 border-t border-gray-800",
            isSidebarCollapsed && "flex justify-center"
        )}>
             {isSidebarCollapsed ? (
                 <button 
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                 >
                    <ChevronRight className="w-5 h-5" />
                 </button>
             ) : (
                 <>
                    <div className="text-xs text-gray-500 mb-2">PROJECT</div>
                    <div className="text-sm font-medium text-gray-300 truncate">Behavior Test</div>
                 </>
             )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div className="flex items-center gap-4">
                {isSimulation && (
                    <Link 
                        to="/"
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        title="Back to Editor"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                )}
                <h1 className="text-lg font-semibold text-gray-800">
                    {isEditor && (currentScenarioName ? `Editing: ${currentScenarioName}` : 'New Scenario')}
                    {isSimulation && 'Simulation Runner'}
                    {isScenarios && 'Saved Scenarios'}
                    {isConfig && 'Settings'}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Action Buttons (Only visible in Editor) */}
                {isEditor && (
                    <div className="flex items-center gap-2 mr-4 border-r border-gray-200 pr-4">
                        <button 
                            onClick={onSave}
                            disabled={loading}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Save to Database"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </button>
                        <Link 
                            to="/simulation"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-green-50 text-green-600 hover:bg-green-100"
                        >
                            <Play className="w-4 h-4" /> Run
                        </Link>
                    </div>
                )}
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

