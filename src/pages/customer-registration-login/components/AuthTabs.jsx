import React from 'react';

const AuthTabs = ({ 
  activeTab = 'login',
  onTabChange = () => {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const tabs = [
    { id: 'login', label: 'Entrar' },
    { id: 'register', label: 'Criar Conta' }
  ];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex bg-muted rounded-lg p-1">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => onTabChange(tab?.id)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === tab?.id
                ? 'text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === tab?.id ? { backgroundColor: primaryColor } : {}}
          >
            {tab?.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AuthTabs;