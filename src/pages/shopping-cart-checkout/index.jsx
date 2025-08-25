import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import CartItemCard from './components/CartItemCard';
import DeliveryMethodSelector from './components/DeliveryMethodSelector';
import AddressSelector from './components/AddressSelector';
import CouponInput from './components/CouponInput';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import OrderSummary from './components/OrderSummary';

const ShoppingCartCheckout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Cart state
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Pizza Margherita Grande',
      price: 32.90,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      extras: [
        { name: 'Borda Catupiry', price: 5.00 },
        { name: 'Extra Queijo', price: 3.50 }
      ],
      instructions: 'Massa bem assada, por favor'
    },
    {
      id: 2,
      name: 'Hambúrguer Artesanal',
      price: 28.50,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      extras: [
        { name: 'Bacon Extra', price: 4.00 },
        { name: 'Batata Rústica', price: 6.00 }
      ]
    },
    {
      id: 3,
      name: 'Refrigerante Lata 350ml',
      price: 4.50,
      quantity: 3,
      image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
      extras: []
    }
  ]);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: 'home',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      zipCode: '01234-567',
      reference: 'Próximo ao mercado Extra',
      fullAddress: 'Rua das Flores, 123, Apto 45, Centro, São Paulo'
    },
    {
      id: 2,
      type: 'work',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 1205',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      zipCode: '01310-100',
      reference: 'Edifício comercial azul',
      fullAddress: 'Av. Paulista, 1000, Sala 1205, Bela Vista, São Paulo'
    }
  ]);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Restaurant branding
  const primaryColor = '#2563EB';
  const restaurantName = 'Sabor & Arte';
  const restaurantLogo = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100';

  useEffect(() => {
    // Set default address
    if (addresses?.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses?.[0]);
    }
  }, [addresses, selectedAddress]);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCartItems(prev => 
      prev?.map(item => 
        item?.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prev => prev?.filter(item => item?.id !== itemId));
  };

  const handleEditItem = (item) => {
    // In a real app, this would open the product customization modal
    console.log('Edit item:', item);
  };

  const handleAddNewAddress = (newAddress) => {
    setAddresses(prev => [...prev, newAddress]);
    setSelectedAddress(newAddress);
  };

  const handleApplyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (cartItems?.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }

    if (deliveryMethod === 'delivery' && !selectedAddress) {
      alert('Selecione um endereço de entrega');
      return;
    }

    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento');
      return;
    }

    setLoading(true);

    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to order tracking
      navigate('/order-tracking-status', {
        state: {
          orderId: `ORD-${Date.now()}`,
          items: cartItems,
          deliveryMethod,
          address: selectedAddress,
          paymentMethod,
          appliedCoupon,
          orderNotes
        }
      });
    } catch (error) {
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems?.reduce((total, item) => {
      const itemPrice = item?.price + (item?.extras?.reduce((sum, extra) => sum + extra?.price, 0) || 0);
      return total + (itemPrice * item?.quantity);
    }, 0);

    const deliveryFee = deliveryMethod === 'delivery' ? 5.99 : 0;
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon?.type === 'percentage') {
        discount = (subtotal * appliedCoupon?.discount) / 100;
      } else {
        discount = appliedCoupon?.discount;
      }
    }

    return subtotal + deliveryFee - discount;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  if (cartItems?.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <BrandedHeader
          restaurantName={restaurantName}
          restaurantLogo={restaurantLogo}
          primaryColor={primaryColor}
          cartItemCount={0}
          onCartClick={() => navigate('/shopping-cart-checkout')}
          onMenuClick={() => navigate('/menu-catalog-product-browse')}
        />
        
        <BottomTabNavigation
          cartItemCount={0}
          primaryColor={primaryColor}
        />

        <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <div className="max-w-md mx-auto text-center">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-current/10"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <Icon name="ShoppingCart" size={40} style={{ color: primaryColor }} />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Seu carrinho está vazio
            </h2>
            
            <p className="text-muted-foreground mb-8">
              Adicione alguns itens deliciosos do nosso cardápio para começar seu pedido.
            </p>
            
            <Button
              onClick={() => navigate('/menu-catalog-product-browse')}
              style={{ backgroundColor: primaryColor }}
              iconName="UtensilsCrossed"
              iconPosition="left"
              className="w-full"
            >
              Ver Cardápio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandedHeader
        restaurantName={restaurantName}
        restaurantLogo={restaurantLogo}
        primaryColor={primaryColor}
        cartItemCount={cartItems?.reduce((sum, item) => sum + item?.quantity, 0)}
        onCartClick={() => navigate('/shopping-cart-checkout')}
        onMenuClick={() => navigate('/menu-catalog-product-browse')}
      />
      <BottomTabNavigation
        cartItemCount={cartItems?.reduce((sum, item) => sum + item?.quantity, 0)}
        primaryColor={primaryColor}
      />
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/menu-catalog-product-browse')}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Cardápio
            </button>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
            <span className="text-foreground font-medium">Carrinho & Checkout</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 pb-32 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items & Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                  Seu Pedido
                </h1>
                <Button
                  variant="outline"
                  onClick={() => navigate('/menu-catalog-product-browse')}
                  iconName="Plus"
                  iconPosition="left"
                  size="sm"
                >
                  Adicionar Itens
                </Button>
              </div>

              <div className="space-y-4">
                {cartItems?.map((item) => (
                  <CartItemCard
                    key={item?.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onEditItem={handleEditItem}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <DeliveryMethodSelector
              selectedMethod={deliveryMethod}
              onMethodChange={setDeliveryMethod}
              primaryColor={primaryColor}
            />

            {/* Address Selection */}
            {deliveryMethod === 'delivery' && (
              <AddressSelector
                selectedAddress={selectedAddress}
                onAddressChange={setSelectedAddress}
                addresses={addresses}
                onAddNewAddress={handleAddNewAddress}
                primaryColor={primaryColor}
              />
            )}

            {/* Coupon Input */}
            <CouponInput
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              primaryColor={primaryColor}
            />

            {/* Payment Method */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              primaryColor={primaryColor}
            />

            {/* Order Notes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Observações do Pedido
              </h3>
              <Input
                type="text"
                placeholder="Alguma observação especial? (opcional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e?.target?.value)}
                description="Ex: sem cebola, ponto da carne, etc."
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cartItems}
              deliveryMethod={deliveryMethod}
              appliedCoupon={appliedCoupon}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </div>
      {/* Sticky Bottom Bar - Mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total do pedido:</span>
          <span className="text-lg font-bold text-foreground">
            {formatPrice(calculateTotal())}
          </span>
        </div>
        
        <Button
          onClick={handlePlaceOrder}
          loading={loading}
          fullWidth
          style={{ backgroundColor: primaryColor }}
          iconName="CreditCard"
          iconPosition="left"
        >
          {loading ? 'Processando...' : 'Finalizar Pedido'}
        </Button>
      </div>
      {/* Desktop Place Order Button */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <Button
          onClick={handlePlaceOrder}
          loading={loading}
          size="lg"
          style={{ backgroundColor: primaryColor }}
          iconName="CreditCard"
          iconPosition="left"
          className="shadow-lg"
        >
          {loading ? 'Processando...' : `Finalizar Pedido - ${formatPrice(calculateTotal())}`}
        </Button>
      </div>
    </div>
  );
};

export default ShoppingCartCheckout;