import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandedHeader from '../../components/ui/BrandedHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import CategoryChips from './components/CategoryChips';
import CategorySidebar from './components/CategorySidebar';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import FloatingCartButton from './components/FloatingCartButton';
import SearchModal from './components/SearchModal';
import BusinessHoursNotice from './components/BusinessHoursNotice';
import ProductSkeleton from './components/ProductSkeleton';
import AuthModal from '../../components/ui/AuthModal';

const MenuCatalogProductBrowse = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBusinessOpen, setIsBusinessOpen] = useState(true);

  // Mock restaurant data
  const restaurantData = {
    name: "Sabor Brasileiro",
    logo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&crop=center",
    primaryColor: "#D97706",
    businessHours: {
      isOpen: true,
      nextOpenTime: "08:00",
      nextOpenDate: "amanhã"
    }
  };

  // Mock categories data
  const categoriesData = [
    { id: 1, name: "Pratos Principais", icon: "UtensilsCrossed", itemCount: 12 },
    { id: 2, name: "Petiscos", icon: "Cookie", itemCount: 8 },
    { id: 3, name: "Bebidas", icon: "Coffee", itemCount: 15 },
    { id: 4, name: "Sobremesas", icon: "IceCream", itemCount: 6 },
    { id: 5, name: "Saladas", icon: "Salad", itemCount: 5 }
  ];

  // Mock products data
  const productsData = [
    {
      id: 1,
      name: "Feijoada Completa",
      description: "Feijoada tradicional com linguiça, bacon, carne seca e acompanhamentos",
      fullDescription: `Nossa feijoada completa é preparada com feijão preto selecionado, linguiça calabresa, bacon defumado, carne seca e costela suína. Acompanha arroz branco, couve refogada, farofa de bacon e laranja fatiada. Uma explosão de sabores da culinária brasileira que serve até 2 pessoas.`,
      price: 45.90,
      originalPrice: 52.90,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
      category: "Pratos Principais",
      categoryId: 1,
      isNew: true,
      discount: 13,
      options: [
        {
          id: 1,
          name: "Tamanho da Porção",
          required: true,
          choices: [
            { id: 1, name: "Individual", price: 0 },
            { id: 2, name: "Para 2 pessoas", price: 15.00 }
          ]
        }
      ],
      extras: [
        { id: 1, name: "Torresmo extra", price: 8.00 },
        { id: 2, name: "Couve extra", price: 5.00 },
        { id: 3, name: "Farofa extra", price: 4.00 }
      ]
    },
    {
      id: 2,
      name: "Picanha na Brasa",
      description: "Picanha grelhada no ponto com acompanhamentos tradicionais",
      fullDescription: `Picanha premium grelhada na brasa, temperada com sal grosso e alho. Acompanha arroz branco, feijão tropeiro, vinagrete e batata frita rústica. Corte nobre preparado no ponto ideal para realçar o sabor da carne.`,
      price: 68.90,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
      category: "Pratos Principais",
      categoryId: 1,
      options: [
        {
          id: 1,
          name: "Ponto da Carne",
          required: true,
          choices: [
            { id: 1, name: "Mal passada", price: 0 },
            { id: 2, name: "Ao ponto", price: 0 },
            { id: 3, name: "Bem passada", price: 0 }
          ]
        }
      ],
      extras: [
        { id: 1, name: "Molho chimichurri", price: 6.00 },
        { id: 2, name: "Batata extra", price: 8.00 }
      ]
    },
    {
      id: 3,
      name: "Moqueca de Camarão",
      description: "Moqueca capixaba com camarões frescos e leite de coco",
      fullDescription: `Moqueca tradicional capixaba preparada com camarões frescos, leite de coco, dendê, tomate, cebola, pimentão e coentro. Servida na panela de barro com pirão de peixe, arroz branco e farofa de dendê. Um clássico da culinária brasileira.`,
      price: 55.90,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "Pratos Principais",
      categoryId: 1,
      extras: [
        { id: 1, name: "Camarão extra", price: 15.00 },
        { id: 2, name: "Pirão extra", price: 5.00 }
      ]
    },
    {
      id: 4,
      name: "Coxinha de Frango",
      description: "Coxinha tradicional com recheio cremoso de frango desfiado",
      fullDescription: `Coxinha artesanal com massa dourada e crocante, recheada com frango desfiado temperado com temperos especiais. Acompanha molho de pimenta da casa. Porção com 6 unidades.`,
      price: 18.90,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      category: "Petiscos",
      categoryId: 2,
      extras: [
        { id: 1, name: "Molho extra", price: 2.00 },
        { id: 2, name: "Coxinha extra (unidade)", price: 3.50 }
      ]
    },
    {
      id: 5,
      name: "Pastel de Queijo",
      description: "Pastel crocante recheado com queijo mussarela derretido",
      fullDescription: `Pastel artesanal com massa fina e crocante, generosamente recheado with queijo mussarela de primeira qualidade. Frito na hora para garantir a crocância perfeita. Porção com 4 unidades.`,
      price: 15.90,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "Petiscos",
      categoryId: 2,
      options: [
        {
          id: 1,
          name: "Tipo de Queijo",
          required: false,
          choices: [
            { id: 1, name: "Mussarela", price: 0 },
            { id: 2, name: "Catupiry", price: 3.00 }
          ]
        }
      ]
    },
    {
      id: 6,
      name: "Refrigerante Lata",
      description: "Refrigerante gelado em lata de 350ml",
      fullDescription: `Refrigerante gelado servido em lata de 350ml. Disponível nos sabores: Coca-Cola, Guaraná Antarctica, Fanta Laranja e Sprite.`,
      price: 5.90,
      image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop",
      category: "Bebidas",
      categoryId: 3,
      options: [
        {
          id: 1,
          name: "Sabor",
          required: true,
          choices: [
            { id: 1, name: "Coca-Cola", price: 0 },
            { id: 2, name: "Guaraná Antarctica", price: 0 },
            { id: 3, name: "Fanta Laranja", price: 0 },
            { id: 4, name: "Sprite", price: 0 }
          ]
        }
      ]
    },
    {
      id: 7,
      name: "Suco Natural",
      description: "Suco natural da fruta, sem conservantes",
      fullDescription: `Suco natural preparado na hora com frutas frescas selecionadas. Sem adição de açúcar, conservantes ou corantes artificiais. Disponível nos sabores: laranja, limão, maracujá, acerola e caju.`,
      price: 8.90,
      image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop",
      category: "Bebidas",
      categoryId: 3,
      options: [
        {
          id: 1,
          name: "Sabor",
          required: true,
          choices: [
            { id: 1, name: "Laranja", price: 0 },
            { id: 2, name: "Limão", price: 0 },
            { id: 3, name: "Maracujá", price: 1.00 },
            { id: 4, name: "Acerola", price: 1.00 },
            { id: 5, name: "Caju", price: 1.00 }
          ]
        }
      ],
      extras: [
        { id: 1, name: "Açúcar", price: 0 },
        { id: 2, name: "Adoçante", price: 0 }
      ]
    },
    {
      id: 8,
      name: "Pudim de Leite",
      description: "Pudim cremoso com calda de caramelo",
      fullDescription: `Pudim de leite condensado artesanal, cremoso e saboroso, coberto com calda de caramelo dourada. Receita tradicional da casa, preparado diariamente com ingredientes frescos.`,
      price: 12.90,
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
      category: "Sobremesas",
      categoryId: 4
    },
    {
      id: 9,
      name: "Salada Caesar",
      description: "Salada com alface americana, croutons e molho caesar",
      fullDescription: `Salada Caesar clássica com alface americana crocante, croutons dourados, queijo parmesão ralado e molho caesar cremoso. Opção de adicionar frango grelhado ou camarões.`,
      price: 24.90,
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
      category: "Saladas",
      categoryId: 5,
      options: [
        {
          id: 1,
          name: "Proteína",
          required: false,
          choices: [
            { id: 1, name: "Sem proteína", price: 0 },
            { id: 2, name: "Frango grelhado", price: 8.00 },
            { id: 3, name: "Camarões", price: 12.00 }
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsBusinessOpen(restaurantData?.businessHours?.isOpen);
  }, []);

  const filteredProducts = activeCategory 
    ? productsData?.filter(product => product?.categoryId === activeCategory)
    : productsData;

  const cartTotal = cartItems?.reduce((sum, item) => sum + (item?.totalPrice || item?.price * item?.quantity), 0);
  const cartItemCount = cartItems?.reduce((sum, item) => sum + item?.quantity, 0);

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (product) => {
    if (!isBusinessOpen) {
      return;
    }

    const existingItemIndex = cartItems?.findIndex(item => 
      item?.id === product?.id && 
      JSON.stringify(item?.selectedExtras) === JSON.stringify(product?.selectedExtras) &&
      JSON.stringify(item?.selectedOptions) === JSON.stringify(product?.selectedOptions)
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += product?.quantity || 1;
      updatedItems[existingItemIndex].totalPrice = updatedItems?.[existingItemIndex]?.price * updatedItems?.[existingItemIndex]?.quantity;
      setCartItems(updatedItems);
    } else {
      const cartItem = {
        ...product,
        quantity: product?.quantity || 1,
        totalPrice: product?.totalPrice || product?.price,
        addedAt: new Date()
      };
      setCartItems(prev => [...prev, cartItem]);
    }
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleCartClick = () => {
    navigate('/shopping-cart-checkout');
  };

  const handleLogin = async (formData) => {
    // Mock login logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Login:', formData);
  };

  const handleRegister = async (formData) => {
    // Mock register logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Register:', formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <BrandedHeader
        restaurantLogo={restaurantData?.logo}
        restaurantName={restaurantData?.name}
        primaryColor={restaurantData?.primaryColor}
        cartItemCount={cartItemCount}
        onSearchClick={handleSearchClick}
        onCartClick={handleCartClick}
        onMenuClick={() => setIsAuthModalOpen(true)}
      />
      {/* Navigation */}
      <BottomTabNavigation
        cartItemCount={cartItemCount}
        primaryColor={restaurantData?.primaryColor}
      />
      <div className="flex">
        {/* Desktop Sidebar */}
        <CategorySidebar
          categories={categoriesData}
          activeCategory={activeCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Category Chips */}
          <CategoryChips
            categories={categoriesData}
            activeCategory={activeCategory}
            onCategorySelect={handleCategorySelect}
            className="lg:hidden"
          />

          {/* Business Hours Notice */}
          <BusinessHoursNotice
            isOpen={isBusinessOpen}
            nextOpenTime={restaurantData?.businessHours?.nextOpenTime}
            nextOpenDate={restaurantData?.businessHours?.nextOpenDate}
          />

          {/* Products Grid */}
          <div className="p-4 lg:p-6 pb-24 md:pb-6">
            {loading ? (
              <ProductSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts?.map((product) => (
                  <ProductCard
                    key={product?.id}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

            {!loading && filteredProducts?.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-muted-foreground">
                  Não há produtos disponíveis nesta categoria no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Floating Cart Button */}
      <FloatingCartButton
        cartItems={cartItems}
        cartTotal={cartTotal}
      />
      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={productsData}
        onProductClick={handleProductClick}
        onAddToCart={handleAddToCart}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        primaryColor={restaurantData?.primaryColor}
      />
    </div>
  );
};

export default MenuCatalogProductBrowse;