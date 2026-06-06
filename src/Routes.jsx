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
import RestauranteGuard from './components/RestauranteGuard';
import RestauranteDashboard from './pages/restaurante-dashboard';
import RestauranteProdutos from './pages/restaurante-produtos';
import RestaurantePedidos from './pages/restaurante-pedidos';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<CustomerAccountOrderHistory />} />
        <Route path="/shopping-cart-checkout" element={<ShoppingCartCheckout />} />
        <Route path="/menu-catalog-product-browse" element={<MenuCatalogProductBrowse />} />
        <Route path="/customer-account-order-history" element={<CustomerAccountOrderHistory />} />
        <Route path="/restaurant-registration-setup" element={<RestaurantRegistrationSetup />} />
        <Route path="/customer-registration-login" element={<CustomerRegistrationLogin />} />
        <Route path="/order-tracking-status" element={<OrderTrackingStatus />} />

        {/* Admin — requer role=admin */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/empresas" element={<AdminGuard><AdminEmpresas /></AdminGuard>} />
        <Route path="/admin/comissoes" element={<AdminGuard><AdminComissoes /></AdminGuard>} />

        {/* Restaurante — requer role=restaurant_owner */}
        <Route path="/restaurante" element={<RestauranteGuard><RestauranteDashboard /></RestauranteGuard>} />
        <Route path="/restaurante/produtos" element={<RestauranteGuard><RestauranteProdutos /></RestauranteGuard>} />
        <Route path="/restaurante/pedidos" element={<RestauranteGuard><RestaurantePedidos /></RestauranteGuard>} />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
