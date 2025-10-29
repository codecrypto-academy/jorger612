'use client';

import { useEffect, useState } from 'react';
import { useWallet } from './contexts/WalletContext';
import ConexionInicial from './components/ConexionInicial';
import RoleSelection from './components/RoleSelection';
import RegistrationStatus from './components/RegistrationStatus';
import WelcomeBack from './components/WelcomeBack';
import ProducerWelcome from './components/ProducerWelcome';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import { Role } from './lib/roles';

export default function Home() {
  const { 
    address,
    isConnected, 
    hasSelectedRole, 
    selectRole, 
    connectWallet, 
    registrationStatus, 
    registrationError, 
    selectedRole, 
    continueToDashboard,
    isAdminAccount,
    isProducerAccount,
    showWelcomeBack,
    showProducerWelcome,
    userInfo,
    isCheckingUserInfo,
    goToDashboard,
    goToProducerDashboard
  } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'userManagement' | 'roleSelection'>('dashboard');
  const [showDashboard, setShowDashboard] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoToDashboard = () => {
    setShowDashboard(true);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking user info
  if (isConnected && isCheckingUserInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Verifying user registration...</p>
        </div>
      </div>
    );
  }

  const handleForceRender = () => {
    // Force re-render when connection state changes
  };

  if (!isConnected) {
    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        <ConexionInicial onConnectionSuccess={handleForceRender} />
      </div>
    );
  }

  // Show UserManagement for Admin when navigating
  if (isConnected && isAdminAccount && currentView === 'userManagement') {
    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        <UserManagement onBackToDashboard={() => setCurrentView('dashboard')} />
      </div>
    );
  }

  // Show WelcomeBack screen for any registered user
  if (isConnected && userInfo) {
    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        {showDashboard ? (
          <Dashboard />
        ) : (
          <WelcomeBack onGoToDashboard={handleGoToDashboard} userInfo={userInfo} />
        )}
      </div>
    );
  }

  // Show registration status screen if registration was attempted
  // Solo mostrar si el estado es 'success' o 'error' (no mostrar durante 'pending')
  if (isConnected && hasSelectedRole && registrationStatus === 'success') {
    const handleContinue = () => {
      continueToDashboard();
    };

    return (
      <div>
        <RegistrationStatus 
          isSuccess={true}
          error={undefined}
          roleName={selectedRole?.name}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // Mostrar error solo si realmente hay un error (no durante pending)
  if (isConnected && hasSelectedRole && registrationStatus === 'error') {
    const handleContinue = () => {
      continueToDashboard();
    };

    return (
      <div>
        <RegistrationStatus 
          isSuccess={false}
          error={registrationError || undefined}
          roleName={selectedRole?.name}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // Show RoleSelection when user clicks "Register Here" - THIS MUST BE FIRST
  if (isConnected && currentView === 'roleSelection') {
    
    const handleRoleSelect = async (role: Role) => {
      await selectRole(role);
    };

    const isLoading = registrationStatus === 'pending';

    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        <RoleSelection onRoleSelect={handleRoleSelect} isLoading={isLoading} />
      </div>
    );
  }

  // Show RegistrationStatus for any unregistered user
  if (isConnected && !userInfo && !isCheckingUserInfo) {
    const handleRegister = () => {
      // Reset registration status to show RoleSelection
      setCurrentView('roleSelection');
    };

    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        <RegistrationStatus 
          isSuccess={true}
          roleName="User"
          customMessage="You are not registered in the system yet."
          onContinue={() => {}}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  // This should not be reached anymore since all unregistered users see RegistrationStatus
  if (isConnected && !hasSelectedRole) {
    const handleRoleSelect = async (role: Role) => {
      await selectRole(role);
    };

    const isLoading = registrationStatus === 'pending';

    return (
      <div>
        <Header 
          onNavigateToUserManagement={() => setCurrentView('userManagement')} 
          onNavigateToDashboard={() => setCurrentView('dashboard')} 
        />
        <RoleSelection onRoleSelect={handleRoleSelect} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div>
      <Header 
        onNavigateToUserManagement={() => setCurrentView('userManagement')} 
        onNavigateToDashboard={() => setCurrentView('dashboard')} 
      />
      <Dashboard />
    </div>
  );
}