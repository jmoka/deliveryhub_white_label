import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import ShoppingCartCheckout from './pages/shopping-cart-checkout';
import MenuCatalogProductBrowse from './pages/menu-catalog-product-browse';
import CustomerAccountOrderHistory from './pages/customer-account-order-history';
import RestaurantRegistrationSetup from './pages/restaurant-registration-setup';
import CustomerRegistrationLogin from './pages/customer-registration-login';
import OrderTrackingStatus from './pages/order-tracking-status';
import AdminDashboard from './pages/admin-dashboard';
import AdminEmpresas from './pages/admin-empresas';
import AdminComissoes from './pages/admin-comissoes';
import AdminGuard from './components/AdminGuard';
import AdminConfiguracoes from './pages/admin-configuracoes';
import AdminEmpresaDetalhe from './pages/admin-empresa-detalhe';
import AdminCategorias from './pages/admin-categorias';
import AdminTiposEstabelecimento from './pages/admin-tipos-estabelecimento';
import AdminTags from './pages/admin-tags';
import RestauranteGuard from './components/RestauranteGuard';
import RestauranteDashboard from './pages/restaurante-dashboard';
import RestauranteProdutos from './pages/restaurante-produtos';
import RestaurantePedidos from './pages/restaurante-pedidos';
import RestauranteCatalogo from './pages/restaurante-catalogo';
import RestauranteConfig from './pages/restaurante-config';
import RestauranteClientes from './pages/restaurante-clientes';
import RestauranteAparencia from './pages/restaurante-aparencia';
import RestauranteMotoboys from './pages/restaurante-motoboys';
import RestauranteEntregas from './pages/restaurante-entregas';
import RestauranteCozinha from './pages/restaurante-cozinha';
import RestauranteProducao from './pages/restaurante-producao';
import RestauranteBar from './pages/restaurante-bar';
import RestauranteSessao from './pages/restaurante-sessao';
import RestauranteCaixa from './pages/restaurante-caixa';
import RestauranteFinanceiro from './pages/restaurante-financeiro';
import RestauranteCombos from './pages/restaurante-combos';
import MotoboyPortal from './pages/motoboy-portal';
import MotoboyCadastro from './pages/motoboy-cadastro';
import CustomerProfile from './pages/customer-profile';
import GarcomPortal from './pages/garcom-portal';
import RestauranteGarcons from './pages/restaurante-garcons';
import RestauranteImpressoras from './pages/restaurante-impressoras';
import RestauranteSalao from './pages/restaurante-salao';
import RestauranteKdsSetor from './pages/restaurante-kds-setor';
import MesaAcompanhar from './pages/mesa-acompanhar';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<MenuCatalogProductBrowse />} />
        <Route path="/shopping-cart-checkout" element={<ShoppingCartCheckout />} />
        <Route path="/menu-catalog-product-browse" element={<MenuCatalogProductBrowse />} />
        <Route path="/customer-account-order-history" element={<CustomerAccountOrderHistory />} />
        <Route path="/restaurant-registration-setup" element={<RestaurantRegistrationSetup />} />
        <Route path="/customer-registration-login" element={<CustomerRegistrationLogin />} />
        <Route path="/order-tracking-status" element={<OrderTrackingStatus />} />

        {/* Admin — requer role=admin */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/empresas" element={<AdminGuard><AdminEmpresas /></AdminGuard>} />
        <Route path="/admin/empresas/:id" element={<AdminGuard><AdminEmpresaDetalhe /></AdminGuard>} />
        <Route path="/admin/comissoes" element={<AdminGuard><AdminComissoes /></AdminGuard>} />
        <Route path="/admin/categorias" element={<AdminGuard><AdminCategorias /></AdminGuard>} />
        <Route path="/admin/tipos-estabelecimento" element={<AdminGuard><AdminTiposEstabelecimento /></AdminGuard>} />
        <Route path="/admin/tags" element={<AdminGuard><AdminTags /></AdminGuard>} />
        <Route path="/admin/configuracoes" element={<AdminGuard><AdminConfiguracoes /></AdminGuard>} />

        {/* Cardápio público por slug — sem auth */}
        <Route path="/r/:slug" element={<RestauranteCatalogo />} />

        {/* Restaurante — requer role=restaurant_owner */}
        <Route path="/restaurante" element={<RestauranteGuard><RestauranteDashboard /></RestauranteGuard>} />
        <Route path="/restaurante/produtos" element={<RestauranteGuard><RestauranteProdutos /></RestauranteGuard>} />
        <Route path="/restaurante/pedidos" element={<RestauranteGuard><RestaurantePedidos /></RestauranteGuard>} />
        <Route path="/restaurante/config" element={<RestauranteGuard><RestauranteConfig /></RestauranteGuard>} />
        <Route path="/restaurante/clientes" element={<RestauranteGuard><RestauranteClientes /></RestauranteGuard>} />
        <Route path="/restaurante/aparencia" element={<RestauranteGuard><RestauranteAparencia /></RestauranteGuard>} />
        <Route path="/restaurante/motoboys" element={<RestauranteGuard><RestauranteMotoboys /></RestauranteGuard>} />
        <Route path="/restaurante/entregas" element={<RestauranteGuard><RestauranteEntregas /></RestauranteGuard>} />
        <Route path="/restaurante/cozinha" element={<RestauranteCozinha />} />
        <Route path="/restaurante/producao" element={<RestauranteGuard><RestauranteProducao /></RestauranteGuard>} />
        <Route path="/restaurante/bar" element={<RestauranteGuard><RestauranteBar /></RestauranteGuard>} />
        <Route path="/restaurante/sessao" element={<RestauranteGuard><RestauranteSessao /></RestauranteGuard>} />
        <Route path="/restaurante/caixa" element={<RestauranteGuard><RestauranteCaixa /></RestauranteGuard>} />
        <Route path="/restaurante/financeiro" element={<RestauranteGuard><RestauranteFinanceiro /></RestauranteGuard>} />
        <Route path="/restaurante/combos" element={<RestauranteGuard><RestauranteCombos /></RestauranteGuard>} />

        {/* Módulo Salão — só estabelecimentos tipo Restaurante */}
        <Route path="/restaurante/salao" element={<RestauranteGuard><RestauranteSalao /></RestauranteGuard>} />
        <Route path="/restaurante/garcons" element={<RestauranteGuard><RestauranteGarcons /></RestauranteGuard>} />
        <Route path="/restaurante/impressoras" element={<RestauranteGuard><RestauranteImpressoras /></RestauranteGuard>} />
        <Route path="/restaurante/kds" element={<RestauranteKdsSetor />} />

        {/* Perfil do cliente */}
        <Route path="/customer-profile" element={<CustomerProfile />} />

        {/* Motoboy portal — token-based, sem Supabase Auth */}
        <Route path="/motoboy" element={<MotoboyPortal />} />
        <Route path="/motoboy/login" element={<MotoboyPortal />} />
        <Route path="/motoboy/cadastro" element={<MotoboyCadastro />} />

        {/* Garçom portal — login próprio via key+senha, sem Supabase Auth */}
        <Route path="/garcom/:loginKey" element={<GarcomPortal />} />

        {/* Acompanhamento público da mesa via QR — sem login */}
        <Route path="/mesa/acompanhar/:token" element={<MesaAcompanhar />} />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
