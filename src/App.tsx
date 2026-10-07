import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useCustomerSessionBackfill } from "./hooks/useCustomerSessionBackfill";
import { ChunkLoadErrorBoundary } from "./components/ChunkLoadErrorBoundary";

// Lazy-loaded route pages
const Landing = lazy(() => import("./pages/index"));

// Customer pages
const CustomerRegister = lazy(() => import("./pages/c/register"));
const CustomerHome = lazy(() => import("./pages/c/home"));
const CustomerWorkers = lazy(() => import("./pages/c/workers"));
const CustomerShops = lazy(() => import("./pages/c/shops"));
const CustomerProfile = lazy(() => import("./pages/c/profile"));
const CustomerWorkerProfile = lazy(() => import("./pages/c/worker.id"));
const CustomerShopProfile = lazy(() => import("./pages/c/shop.id"));

// Worker pages
const WorkerRegister = lazy(() => import("./pages/w/register"));
const WorkerDashboard = lazy(() => import("./pages/w/dashboard"));
const WorkerContacts = lazy(() => import("./pages/w/contacts"));
const WorkerWorkers = lazy(() => import("./pages/w/workers"));
const WorkerShops = lazy(() => import("./pages/w/shops"));
const WorkerWorkerProfile = lazy(() => import("./pages/w/worker.id"));
const WorkerShopProfile = lazy(() => import("./pages/w/shop.id"));
const WorkerProfile = lazy(() => import("./pages/w/profile"));

// Shop pages
const ShopRegister = lazy(() => import("./pages/s/register"));
const ShopDashboard = lazy(() => import("./pages/s/dashboard"));
const ShopContacts = lazy(() => import("./pages/s/contacts"));
const ShopWorkers = lazy(() => import("./pages/s/workers"));
const ShopShops = lazy(() => import("./pages/s/shops"));
const ShopWorkerProfile = lazy(() => import("./pages/s/worker.id"));
const ShopShopProfile = lazy(() => import("./pages/s/shop.id"));
const ShopProducts = lazy(() => import("./pages/s/products"));
const ShopOffersPage = lazy(() => import("./pages/s/offers"));
const ShopOfferEditor = lazy(() => import("./pages/s/offer-editor"));
const ShopOfferView = lazy(() => import("./pages/s/offer-view"));
const ShopProfile = lazy(() => import("./pages/s/profile"));

// Activity pages
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const ActivityCategoryPage = lazy(() =>
  import("./pages/ActivityPage").then((m) => ({ default: m.ActivityCategoryPage })),
);

// Legal pages
const TermsAndConditions = lazy(() => import("./pages/legal/terms"));
const PrivacyPolicy = lazy(() => import("./pages/legal/privacy"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/login"));
const AdminResetPassword = lazy(() => import("./pages/admin/reset-password"));
const AdminOverview = lazy(() => import("./pages/admin/overview"));
const AdminCustomers = lazy(() => import("./pages/admin/customers"));
const AdminWorkers = lazy(() => import("./pages/admin/workers"));
const AdminShops = lazy(() => import("./pages/admin/shops"));
const AdminProducts = lazy(() => import("./pages/admin/products"));
const AdminSupport = lazy(() => import("./pages/admin/support"));
const AdminActivity = lazy(() => import("./pages/admin/activity"));
const AdminOfficialUpdates = lazy(() => import("./pages/admin/official-updates"));
const AdminShopOffers = lazy(() => import("./pages/admin/shop-offers"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics"));
const AdminSecurity = lazy(() => import("./pages/admin/security"));
const AdminSystemHealth = lazy(() => import("./pages/admin/health"));
const AdminSeoCenter = lazy(() => import("./pages/admin/seo"));
const FounderVault = lazy(() => import("./pages/admin/founder-vault"));

// Public discovery pages
const PublicWorkersPage = lazy(() =>
  import("./components/PublicDiscoveryPages").then((m) => ({ default: m.PublicWorkersPage })),
);
const PublicShopsPage = lazy(() =>
  import("./components/PublicDiscoveryPages").then((m) => ({ default: m.PublicShopsPage })),
);
const PublicWorkerProfilePage = lazy(() =>
  import("./components/PublicDiscoveryPages").then((m) => ({ default: m.PublicWorkerProfilePage })),
);
const PublicShopProfilePage = lazy(() =>
  import("./components/PublicDiscoveryPages").then((m) => ({ default: m.PublicShopProfilePage })),
);

function PageLoadingFallback() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      <p className="mt-3 text-xs font-semibold text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-md bg-primary text-white">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  useCustomerSessionBackfill();

  return (
    <ChunkLoadErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/workers" element={<PublicWorkersPage hrefPrefix="" />} />
          <Route path="/shops" element={<PublicShopsPage hrefPrefix="" />} />
          <Route path="/worker/:id" element={<PublicWorkerProfilePage backTo="/workers" />} />
          <Route path="/shop/:id" element={<PublicShopProfilePage backTo="/shops" />} />
          <Route path="/c/register" element={<CustomerRegister />} />
          <Route path="/c/home" element={<CustomerHome />} />
          <Route path="/c/activity" element={<ActivityPage role="customer" />} />
          <Route
            path="/c/activity/official"
            element={<ActivityCategoryPage role="customer" category="official" />}
          />
          <Route
            path="/c/activity/shop-offers"
            element={<ActivityCategoryPage role="customer" category="shop-offers" />}
          />
          <Route
            path="/c/activity/new-near-you"
            element={<ActivityCategoryPage role="customer" category="new-near-you" />}
          />
          <Route path="/c/workers" element={<CustomerWorkers />} />
          <Route path="/c/shops" element={<CustomerShops />} />
          <Route path="/c/profile" element={<CustomerProfile />} />
          <Route path="/c/worker/:id" element={<CustomerWorkerProfile />} />
          <Route path="/c/shop/:id" element={<CustomerShopProfile />} />
          <Route path="/worker/register" element={<WorkerRegister />} />
          <Route path="/w/register" element={<WorkerRegister />} />
          <Route path="/w/dashboard" element={<WorkerDashboard />} />
          <Route path="/w/activity" element={<ActivityPage role="worker" />} />
          <Route
            path="/w/activity/official"
            element={<ActivityCategoryPage role="worker" category="official" />}
          />
          <Route
            path="/w/activity/shop-offers"
            element={<ActivityCategoryPage role="worker" category="shop-offers" />}
          />
          <Route
            path="/w/activity/new-near-you"
            element={<ActivityCategoryPage role="worker" category="new-near-you" />}
          />
          <Route path="/w/contacts" element={<WorkerContacts />} />
          <Route path="/w/workers" element={<WorkerWorkers />} />
          <Route path="/w/shops" element={<WorkerShops />} />
          <Route path="/w/worker/:id" element={<WorkerWorkerProfile />} />
          <Route path="/w/shop/:id" element={<WorkerShopProfile />} />
          <Route path="/w/profile" element={<WorkerProfile />} />
          <Route path="/shop/register" element={<ShopRegister />} />
          <Route path="/s/register" element={<ShopRegister />} />
          <Route path="/s/dashboard" element={<ShopDashboard />} />
          <Route path="/s/activity" element={<ActivityPage role="shop" />} />
          <Route
            path="/s/activity/official"
            element={<ActivityCategoryPage role="shop" category="official" />}
          />
          <Route
            path="/s/activity/shop-offers"
            element={<ActivityCategoryPage role="shop" category="shop-offers" />}
          />
          <Route
            path="/s/activity/new-near-you"
            element={<ActivityCategoryPage role="shop" category="new-near-you" />}
          />
          <Route path="/s/contacts" element={<ShopContacts />} />
          <Route path="/s/workers" element={<ShopWorkers />} />
          <Route path="/s/shops" element={<ShopShops />} />
          <Route path="/s/worker/:id" element={<ShopWorkerProfile />} />
          <Route path="/s/shop/:id" element={<ShopShopProfile />} />
          <Route path="/s/products" element={<ShopProducts />} />
          <Route path="/s/offers" element={<ShopOffersPage />} />
          <Route path="/s/offers/new" element={<ShopOfferEditor />} />
          <Route path="/s/offers/:id" element={<ShopOfferView />} />
          <Route path="/s/offers/:id/edit" element={<ShopOfferEditor />} />
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
          <Route path="/admin/official-updates" element={<AdminOfficialUpdates />} />
          <Route path="/admin/shop-offers" element={<AdminShopOffers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/health" element={<AdminSystemHealth />} />
          <Route path="/admin/seo" element={<AdminSeoCenter />} />
          <Route path="/admin/founder-vault" element={<FounderVault />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ChunkLoadErrorBoundary>
  );
}
