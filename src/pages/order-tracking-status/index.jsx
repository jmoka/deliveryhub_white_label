import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import OrderStatusTimeline from './components/OrderStatusTimeline';
import OrderDetailsCard from './components/OrderDetailsCard';
import DeliveryMap from './components/DeliveryMap';
import LiveChatButton from './components/LiveChatButton';
import OrderActions from './components/OrderActions';
import Icon from '../../components/AppIcon';

const OrderTrackingStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mock restaurant branding
  const restaurantBranding = {
    name: 'Pizzaria Bella Vista',
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
    primaryColor: '#DC2626',
    phone: '5511999887766'
  };

  // Mock order data with real-time updates simulation
  const [orderData, setOrderData] = useState({
    id: '#12345',
    status: 'preparing', // confirmed, preparing, out_for_delivery, delivered, cancelled
    estimatedTime: '25-30 min',
    orderTime: '14:30',
    lastUpdate: new Date()?.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  });

  const [cartItemCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time order updates
  useEffect(() => {
    const statusProgression = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    let currentIndex = statusProgression?.indexOf(orderData?.status);

    const interval = setInterval(() => {
      if (currentIndex < statusProgression?.length - 1) {
        currentIndex++;
        setOrderData(prev => ({
          ...prev,
          status: statusProgression?.[currentIndex],
          lastUpdate: new Date()?.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          estimatedTime: currentIndex === statusProgression?.length - 1 ? '' : prev?.estimatedTime
        }));
      }
    }, 30000); // Update every 30 seconds for demo

    return () => clearInterval(interval);
  }, [orderData?.status]);

  // Handle navigation
  const handleSearchClick = () => {
    navigate('/menu-catalog-product-browse');
  };

  const handleCartClick = () => {
    navigate('/shopping-cart-checkout');
  };

  const handleMenuClick = () => {
    // Toggle mobile menu
  };

  const handleCancelOrder = ({ orderId, reason }) => {
    setOrderData(prev => ({
      ...prev,
      status: 'cancelled',
      cancelReason: reason,
      lastUpdate: new Date()?.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  };

  const handleReorder = (orderId) => {
    navigate('/menu-catalog-product-browse', { 
      state: { reorderFrom: orderId } 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#3B82F6';
      case 'preparing': return '#F59E0B';
      case 'out_for_delivery': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return restaurantBranding?.primaryColor;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Pedido Confirmado';
      case 'preparing': return 'Preparando';
      case 'out_for_delivery': return 'Saiu para Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return 'Processando';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <BrandedHeader
        restaurantLogo={restaurantBranding?.logo}
        restaurantName={restaurantBranding?.name}
        primaryColor={restaurantBranding?.primaryColor}
        cartItemCount={cartItemCount}
        onSearchClick={handleSearchClick}
        onCartClick={handleCartClick}
        onMenuClick={handleMenuClick}
      />
      {/* Navigation */}
      <BottomTabNavigation
        cartItemCount={cartItemCount}
        primaryColor={restaurantBranding?.primaryColor}
      />
      {/* Main Content */}
      <main className="pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors duration-200"
              >
                <Icon name="ArrowLeft" size={20} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Pedido {orderData?.id}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(orderData?.status) }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: getStatusColor(orderData?.status) }}
                  >
                    {getStatusText(orderData?.status)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • Atualizado às {orderData?.lastUpdate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Timeline */}
              <OrderStatusTimeline
                currentStatus={orderData?.status}
                estimatedTime={orderData?.estimatedTime}
                orderTime={orderData?.orderTime}
                primaryColor={restaurantBranding?.primaryColor}
              />

              {/* Order Details */}
              <OrderDetailsCard
                order={orderData}
                primaryColor={restaurantBranding?.primaryColor}
              />

              {/* Delivery Map - Mobile */}
              <div className="lg:hidden">
                <DeliveryMap
                  orderStatus={orderData?.status}
                  primaryColor={restaurantBranding?.primaryColor}
                />
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Delivery Map - Desktop */}
              <div className="hidden lg:block">
                <DeliveryMap
                  orderStatus={orderData?.status}
                  primaryColor={restaurantBranding?.primaryColor}
                />
              </div>

              {/* Order Actions */}
              <OrderActions
                orderStatus={orderData?.status}
                orderId={orderData?.id}
                onCancelOrder={handleCancelOrder}
                onReorder={handleReorder}
                primaryColor={restaurantBranding?.primaryColor}
              />

              {/* Support Section - Desktop */}
              <div className="hidden md:block">
                <LiveChatButton
                  restaurantName={restaurantBranding?.name}
                  restaurantPhone={restaurantBranding?.phone}
                  orderId={orderData?.id}
                  primaryColor={restaurantBranding?.primaryColor}
                />
              </div>
            </div>
          </div>

          {/* Order Cancelled Message */}
          {orderData?.status === 'cancelled' && (
            <div className="mt-6 p-6 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon name="XCircle" size={24} className="text-error mt-1" />
                <div>
                  <h3 className="font-medium text-error mb-1">
                    Pedido Cancelado
                  </h3>
                  <p className="text-sm text-error/80">
                    Seu pedido foi cancelado com sucesso. 
                    {orderData?.cancelReason && ` Motivo: ${orderData?.cancelReason}`}
                  </p>
                  <p className="text-sm text-error/80 mt-2">
                    O reembolso será processado em até 5 dias úteis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Delivered Message */}
          {orderData?.status === 'delivered' && (
            <div 
              className="mt-6 p-6 rounded-lg border"
              style={{ 
                backgroundColor: `${restaurantBranding?.primaryColor}10`,
                borderColor: `${restaurantBranding?.primaryColor}30`
              }}
            >
              <div className="flex items-start space-x-3">
                <Icon 
                  name="CheckCircle" 
                  size={24} 
                  style={{ color: restaurantBranding?.primaryColor }}
                  className="mt-1"
                />
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    Pedido Entregue com Sucesso!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esperamos que tenha gostado da sua refeição. 
                    Que tal avaliar seu pedido e deixar um comentário?
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Live Chat Button - Mobile */}
      <div className="md:hidden">
        <LiveChatButton
          restaurantName={restaurantBranding?.name}
          restaurantPhone={restaurantBranding?.phone}
          orderId={orderData?.id}
          primaryColor={restaurantBranding?.primaryColor}
        />
      </div>
    </div>
  );
};

export default OrderTrackingStatus;