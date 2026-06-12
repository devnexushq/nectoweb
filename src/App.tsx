import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/index";
import CustomerRegister from "./pages/c/register";
import CustomerHome from "./pages/c/home";
import CustomerWorkers from "./pages/c/workers";
import CustomerShops from "./pages/c/shops";
import CustomerProfile from "./pages/c/profile";
import CustomerWorkerProfile from "./pages/c/worker.id";
import CustomerShopProfile from "./pages/c/shop.id";
import WorkerRegister from "./pages/w/register";
import WorkerDashboard from "./pages/w/dashboard";
import WorkerContacts from "./pages/w/contacts";
import WorkerShops from "./pages/w/shops";
import WorkerShopProfile from "./pages/w/shop.id";
import WorkerProfile from "./pages/w/profile";
import ShopRegister from "./pages/s/register";
import ShopDashboard from "./pages/s/dashboard";
import ShopContacts from "./pages/s/contacts";
import ShopWorkers from "./pages/s/workers";
import ShopWorkerProfile from "./pages/s/worker.id";
import ShopProducts from "./pages/s/products";
import ShopProfile from "./pages/s/profile";
import TermsAndConditions from "./pages/legal/terms";
import PrivacyPolicy from "./pages/legal/privacy";
import AdminLogin from "./pages/admin/login";
import AdminResetPassword from "./pages/admin/reset-password";
import AdminOverview from "./pages/admin/overview";
import AdminCustomers from "./pages/admin/customers";
import AdminWorkers from "./pages/admin/workers";
import AdminShops from "./pages/admin/shops";
import AdminProducts from "./pages/admin/products";
import AdminSupport from "./pages/admin/support";
import AdminActivity from "./pages/admin/activity";
import AdminAnalytics from "./pages/admin/analytics";

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-md bg-primary text-white">Go home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/c/register" element={<CustomerRegister />} />
      <Route path="/c/home" element={<CustomerHome />} />
      <Route path="/c/workers" element={<CustomerWorkers />} />
      <Route path="/c/shops" element={<CustomerShops />} />
      <Route path="/c/profile" element={<CustomerProfile />} />
      <Route path="/c/worker/:id" element={<CustomerWorkerProfile />} />
      <Route path="/c/shop/:id" element={<CustomerShopProfile />} />
      <Route path="/worker/register" element={<WorkerRegister />} />
      <Route path="/w/register" element={<WorkerRegister />} />
      <Route path="/w/dashboard" element={<WorkerDashboard />} />
      <Route path="/w/contacts" element={<WorkerContacts />} />
      <Route path="/w/shops" element={<WorkerShops />} />
      <Route path="/w/shop/:id" element={<WorkerShopProfile />} />
      <Route path="/w/profile" element={<WorkerProfile />} />
      <Route path="/shop/register" element={<ShopRegister />} />
      <Route path="/s/register" element={<ShopRegister />} />
      <Route path="/s/dashboard" element={<ShopDashboard />} />
      <Route path="/s/contacts" element={<ShopContacts />} />
      <Route path="/s/workers" element={<ShopWorkers />} />
      <Route path="/s/worker/:id" element={<ShopWorkerProfile />} />
      <Route path="/s/products" element={<ShopProducts />} />
      <Route path="/s/profile" element={<ShopProfile />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route path="/admin" element={<AdminOverview />} />
      <Route path="/admin/customers" element={<AdminCustomers />} />
      <Route path="/admin/workers" element={<AdminWorkers />} />
      <Route path="/admin/shops" element={<AdminShops />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/support" element={<AdminSupport />} />
      <Route path="/admin/activity" element={<AdminActivity />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
