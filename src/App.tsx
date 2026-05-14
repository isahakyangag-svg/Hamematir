/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import Stores from './pages/Stores';
import Profile from './pages/Profile';
import Partnership from './pages/Partnership';
import Advertising from './pages/Advertising';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorPage from './pages/ErrorPage';
import CustomPage from './pages/CustomPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/Dashboard';
import AdminStores from './pages/admin/AdminStores';
import AdminNotes from './pages/admin/AdminNotes';
import AdminBulkSync from './pages/admin/AdminBulkSync';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBrands from './pages/admin/AdminBrands';
import AdminAppearance from './pages/admin/AdminAppearance';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSupport from './pages/admin/AdminSupport';
import AdminBanners from './pages/admin/AdminBanners';
import AdminMonetization from './pages/admin/AdminMonetization';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTranslations from './pages/admin/AdminTranslations';
import AdminCurrency from './pages/admin/AdminCurrency';
import AdminFooter from './pages/admin/AdminFooter';
import AdminAuthPages from './pages/admin/AdminAuthPages';
import AdminMyCodes from './pages/admin/AdminMyCodes';

import PartnerLayout from './pages/partner/PartnerLayout';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerBanners from './pages/partner/PartnerBanners';
import PartnerOrderBanner from './pages/partner/PartnerOrderBanner';
import PartnerFinance from './pages/partner/PartnerFinance';
import PartnerAnalytics from './pages/partner/PartnerAnalytics';
import PartnerMessages from './pages/partner/PartnerMessages';

import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { TranslationProvider } from './contexts/TranslationContext';

import { BrandingProvider } from './contexts/BrandingContext';

export default function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <TranslationProvider>
          <CurrencyProvider>
            <Router>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/partnership" element={<Partnership />} />
                  <Route path="/advertising" element={<Advertising />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/page/:id" element={<CustomPage />} />
                  <Route path="/Error" element={<ErrorPage />} />
                  <Route path="*" element={<ErrorPage />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="stores" element={<AdminStores />} />
                  <Route path="notes" element={<AdminNotes />} />
                  <Route path="sync" element={<AdminBulkSync />} />
                  <Route path="brands" element={<AdminBrands />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="appearance" element={<AdminAppearance />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="monetization" element={<AdminMonetization />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="translations" element={<AdminTranslations />} />
                  <Route path="footer" element={<AdminFooter />} />
                  <Route path="auth" element={<AdminAuthPages />} />
                  <Route path="currency" element={<AdminCurrency />} />
                  <Route path="my-codes" element={<AdminMyCodes />} />
                </Route>
                <Route path="/partner" element={<PartnerLayout />}>
                  <Route index element={<PartnerDashboard />} />
                  <Route path="banners" element={<PartnerBanners />} />
                  <Route path="banners/order" element={<PartnerOrderBanner />} />
                  <Route path="suggestions" element={<div className="p-10 text-white font-black text-4xl">SUGGESTIONS</div>} />
                  <Route path="finance" element={<PartnerFinance />} />
                  <Route path="analytics" element={<PartnerAnalytics />} />
                  <Route path="messages" element={<PartnerMessages />} />
                  <Route path="chat" element={<PartnerMessages />} />
                  <Route path="support" element={<div className="p-10 text-white font-black text-4xl">SUPPORT</div>} />
                  <Route path="settings" element={<div className="p-10 text-white font-black text-4xl">SETTINGS</div>} />
                  <Route path="help" element={<div className="p-10 text-white font-black text-4xl">HELP</div>} />
                </Route>
              </Routes>
            </Router>
          </CurrencyProvider>
        </TranslationProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}

