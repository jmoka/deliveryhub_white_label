import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import Icon from '../../components/AppIcon';


// Import all components
import ProfileSection from './components/ProfileSection';
import AddressBook from './components/AddressBook';
import OrderHistory from './components/OrderHistory';
import PreferencesSettings from './components/PreferencesSettings';
import PaymentMethods from './components/PaymentMethods';
import AccountSettings from './components/AccountSettings';

const CustomerAccountOrderHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [cartItemCount] = useState(3);
  const [loading, setLoading] = useState(false);

  // Restaurant branding
  const restaurantConfig = {
    name: "DeliveryHub",
    logo: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop&crop=center",
    primaryColor: "#2563EB"
  };

  // Mock user data
  const [userData, setUserData] = useState({
    id: 1,
    name: "Maria Silva Santos",
    email: "maria.santos@email.com",
    phone: "(11) 99876-5432",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=center",
    whatsappVerified: true,
    memberSince: "Janeiro 2024"
  });

  // Mock addresses data
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: "Casa",
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      state: "SP",
      zipCode: "05435-000",
      reference: "Próximo ao metrô Vila Madalena",
      isPrimary: true,
      lat: -23.5505,
      lng: -46.6333
    },
    {
      id: 2,
      label: "Trabalho",
      street: "Avenida Paulista",
      number: "1000",
      complement: "14º andar",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      reference: "Edifício comercial azul",
      isPrimary: false,
      lat: -23.5618,
      lng: -46.6565
    }
  ]);

  // Mock orders data
  const [orders] = useState([
    {
      id: "ORD-2025-001",
      restaurant: {
        name: "Pizzaria Bella Vista",
        logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center"
      },
      date: "2025-08-24T19:30:00",
      status: "delivered",
      total: 45.90,
      items: [
        { name: "Pizza Margherita", quantity: 1, price: 32.90 },
        { name: "Refrigerante 2L", quantity: 1, price: 8.00 },
        { name: "Taxa de entrega", quantity: 1, price: 5.00 }
      ],
      rating: 5
    },
    {
      id: "ORD-2025-002",
      restaurant: {
        name: "Burger House",
        logo: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop&crop=center"
      },
      date: "2025-08-23T20:15:00",
      status: "delivered",
      total: 38.50,
      items: [
        { name: "Burger Clássico", quantity: 2, price: 15.00 },
        { name: "Batata Frita", quantity: 1, price: 8.50 }
      ],
      rating: 4
    },
    {
      id: "ORD-2025-003",
      restaurant: {
        name: "Sushi Zen",
        logo: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop&crop=center"
      },
      date: "2025-08-22T18:45:00",
      status: "preparing",
      total: 67.80,
      items: [
        { name: "Combo Sushi 20 peças", quantity: 1, price: 55.00 },
        { name: "Temaki Salmão", quantity: 2, price: 6.40 }
      ]
    }
  ]);

  // Mock payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'visa',
      brand: 'visa',
      lastFour: '4532',
      holderName: 'Maria Silva Santos',
      expiryDate: '12/28',
      isDefault: true
    },
    {
      id: 2,
      type: 'mastercard',
      brand: 'mastercard',
      lastFour: '8765',
      holderName: 'Maria Silva Santos',
      expiryDate: '06/27',
      isDefault: false
    }
  ]);

  // Mock preferences
  const [preferences, setPreferences] = useState({
    notifications: {
      whatsapp: true,
      email: true,
      promotional: false,
      orderUpdates: true
    },
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: true,
      lactoseFree: false,
      diabetic: false
    },
    favorites: [1, 2, 3],
    language: 'pt-BR',
    currency: 'BRL'
  });

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: 'User' },
    { id: 'addresses', label: 'Endereços', icon: 'MapPin' },
    { id: 'orders', label: 'Pedidos', icon: 'ShoppingBag' },
    { id: 'payment', label: 'Pagamento', icon: 'CreditCard' },
    { id: 'preferences', label: 'Preferências', icon: 'Settings' },
    { id: 'account', label: 'Conta', icon: 'Shield' }
  ];

  // Event handlers
  const handleUpdateProfile = async (profileData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserData(prev => ({ ...prev, ...profileData }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (addressData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newAddress = {
        ...addressData,
        id: addresses?.length + 1,
        isPrimary: addresses?.length === 0,
        lat: -23.5505 + (Math.random() - 0.5) * 0.1,
        lng: -46.6333 + (Math.random() - 0.5) * 0.1
      };
      setAddresses(prev => [...prev, newAddress]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = async (id, addressData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAddresses(prev => prev?.map(addr => 
        addr?.id === id ? { ...addr, ...addressData } : addr
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
      setAddresses(prev => prev?.filter(addr => addr?.id !== id));
    }
  };

  const handleSetPrimaryAddress = async (id) => {
    setAddresses(prev => prev?.map(addr => ({
      ...addr,
      isPrimary: addr?.id === id
    })));
  };

  const handleReorder = (order) => {
    // Add items to cart and navigate to checkout
    navigate('/shopping-cart-checkout');
  };

  const handleViewOrderDetails = (order) => {
    // Navigate to order tracking with order details
    navigate('/order-tracking-status', { state: { orderId: order?.id } });
  };

  const handleAddPaymentMethod = async (methodData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newMethod = {
        ...methodData,
        id: paymentMethods?.length + 1,
        lastFour: methodData?.cardNumber?.slice(-4),
        brand: methodData?.cardNumber?.startsWith('4') ? 'visa' : 'mastercard',
        isDefault: paymentMethods?.length === 0
      };
      setPaymentMethods(prev => [...prev, newMethod]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este método de pagamento?')) {
      setPaymentMethods(prev => prev?.filter(method => method?.id !== id));
    }
  };

  const handleSetDefaultPayment = async (id) => {
    setPaymentMethods(prev => prev?.map(method => ({
      ...method,
      isDefault: method?.id === id
    })));
  };

  const handleUpdatePreferences = async (newPreferences) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPreferences(newPreferences);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Redirect to login page
      navigate('/customer-registration-login');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate data export
      const dataBlob = new Blob([JSON.stringify({
        user: userData,
        addresses,
        orders,
        preferences
      }, null, 2)], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados-deliveryhub.json';
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da sua conta?')) {
      navigate('/customer-registration-login');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSection
            user={userData}
            onUpdateProfile={handleUpdateProfile}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      case 'addresses':
        return (
          <AddressBook
            addresses={addresses}
            onAddAddress={handleAddAddress}
            onEditAddress={handleEditAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetPrimary={handleSetPrimaryAddress}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      case 'orders':
        return (
          <OrderHistory
            orders={orders}
            onReorder={handleReorder}
            onViewDetails={handleViewOrderDetails}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      case 'payment':
        return (
          <PaymentMethods
            paymentMethods={paymentMethods}
            onAddPaymentMethod={handleAddPaymentMethod}
            onRemovePaymentMethod={handleRemovePaymentMethod}
            onSetDefault={handleSetDefaultPayment}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      case 'preferences':
        return (
          <PreferencesSettings
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      case 'account':
        return (
          <AccountSettings
            onDeleteAccount={handleDeleteAccount}
            onExportData={handleExportData}
            onLogout={handleLogout}
            primaryColor={restaurantConfig?.primaryColor}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <BrandedHeader
        restaurantLogo={restaurantConfig?.logo}
        restaurantName={restaurantConfig?.name}
        primaryColor={restaurantConfig?.primaryColor}
        cartItemCount={cartItemCount}
        onCartClick={() => navigate('/shopping-cart-checkout')}
        onMenuClick={() => navigate('/menu-catalog-product-browse')}
      />
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-card border-b border-border">
        <div className="px-10 py-4">
          <div className="flex items-center space-x-8">
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab?.id
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={activeTab === tab?.id ? {
                  backgroundColor: restaurantConfig?.primaryColor,
                  color: 'white'
                } : {}}
              >
                <Icon 
                  name={tab?.icon} 
                  size={20} 
                  className={activeTab === tab?.id ? 'text-white' : 'text-current'} 
                />
                <span className="text-sm">{tab?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Mobile Tab Navigation */}
      <div className="md:hidden bg-card border-b border-border">
        <div className="px-4 py-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab?.id
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={activeTab === tab?.id ? {
                  backgroundColor: restaurantConfig?.primaryColor,
                  color: 'white'
                } : {}}
              >
                <Icon 
                  name={tab?.icon} 
                  size={16} 
                  className={activeTab === tab?.id ? 'text-white' : 'text-current'} 
                />
                <span className="text-xs">{tab?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-10 py-6 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                <img
                  src={userData?.avatar}
                  alt={userData?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/images/no_image.png';
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Olá, {userData?.name?.split(' ')?.[0]}!</h1>
                <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomTabNavigation
        cartItemCount={cartItemCount}
        primaryColor={restaurantConfig?.primaryColor}
      />
    </div>
  );
};

export default CustomerAccountOrderHistory;