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

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<CustomerAccountOrderHistory />} />
        <Route path="/shopping-cart-checkout" element={<ShoppingCartCheckout />} />
        <Route path="/menu-catalog-product-browse" element={<MenuCatalogProductBrowse />} />
        <Route path="/customer-account-order-history" element={<CustomerAccountOrderHistory />} />
        <Route path="/restaurant-registration-setup" element={<RestaurantRegistrationSetup />} />
        <Route path="/customer-registration-login" element={<CustomerRegistrationLogin />} />
        <Route path="/order-tracking-status" element={<OrderTrackingStatus />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
