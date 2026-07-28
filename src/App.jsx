import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AppUsers } from './pages/users/AppUsers';
import { ViewUser } from './pages/users/ViewUser';
import { Moments } from './pages/users/Moments';
import { AdminAgencyHost } from './pages/users/AdminAgencyHost';
import { DeletedAccounts } from './pages/users/DeletedAccounts';
import { PlayStorePurchases } from './pages/wallet/PlayStorePurchases';
import { WalletFreezeUnfreeze } from './pages/wallet/WalletFreezeUnfreeze';
import { AddDeductCoins } from './pages/wallet/AddDeductCoins';
import { AddDeductBeans } from './pages/wallet/AddDeductBeans';
import { MallPurchaseRecord } from './pages/wallet/MallPurchaseRecord';
import { TransactionRecord } from './pages/wallet/TransactionRecord';
import { CoinPricing } from './pages/wallet/CoinPricing';
import { IDBanUnban } from './pages/account/IDBanUnban';
import { DeviceBlockUnblock } from './pages/account/DeviceBlockUnblock';
import { RoomBanUnban } from './pages/account/RoomBanUnban';
import { AdminRequest } from './pages/requests/AdminRequest';
import { AgencyRequest } from './pages/requests/AgencyRequest';
import { HostRequest } from './pages/requests/HostRequest';
import { Requests } from './pages/requests/Requests';
import { AgentRequest } from './pages/agent/AgentRequest';
import { OnlineAgent } from './pages/agent/OnlineAgent';
import { AgentCalls } from './pages/agent/AgentCalls';
import { BannerUpload } from './pages/custom/BannerUpload';
import { GiftUpload } from './pages/custom/GiftUpload';
import { HomeImageUpload } from './pages/custom/HomeImageUpload';
import { GameList } from './pages/custom/GameList';
import { Customizations } from './pages/customization/Customizations';
import { BankWithdraw } from './pages/withdraw/BankWithdraw';
import { WalletWithdraw } from './pages/withdraw/WalletWithdraw';
import { ResellerCoinDeduction } from './pages/reseller/ResellerCoinDeduction';
import { ResellerSummary } from './pages/reseller/ResellerSummary';
import { ResellerTransactions } from './pages/reseller/ResellerTransactions';
import { AudioStreaming } from './pages/streaming/AudioStreaming';
import { EndUserStream } from './pages/streaming/EndUserStream';
import { Reports } from './pages/reports/Reports';
import { Rewards } from './pages/rewards/Rewards';
import { VersionUpdate } from './pages/version/VersionUpdate';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CreateReseller } from './pages/reseller/CreateReseller';
import { CoinReselling } from './pages/reseller/CoinReselling';
import ApproveAgentRequest from './pages/agent/ApproveAgentRequest';
import { AdminToResellerTransection } from './pages/reseller/AdminToResellerTransection';
import { WhatsAppOTPLogs } from './pages/whatsapplogs/WhatsAppOTPLogs';
import { StaticOtp } from './pages/staticopt/StaticOtp';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const isRestrictedAdmin = user && JSON.stringify(user).includes('8576075126');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={isRestrictedAdmin ? "/requests" : "/dashboard"} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users/app-users" element={<AppUsers />} />
        <Route path="users/view/:userId" element={<ViewUser />} />
        <Route path="users/moments" element={<Moments />} />
        <Route path="users/admin-agency-host" element={<AdminAgencyHost />} />
        <Route path="users/deleted" element={<DeletedAccounts />} />
        <Route path="wallet/playstore" element={<PlayStorePurchases />} />
        <Route path="wallet/freeze" element={<WalletFreezeUnfreeze />} />
        <Route path="wallet/coins" element={<AddDeductCoins />} />
        <Route path="wallet/beans" element={<AddDeductBeans />} />
        <Route path="wallet/mall" element={<MallPurchaseRecord />} />
        <Route path="wallet/transactions" element={<TransactionRecord />} />
        <Route path="wallet/coin-pricing" element={<CoinPricing />} />
        <Route path="wallet/*" element={<AppUsers />} />
        <Route path="account/id-ban" element={<IDBanUnban />} />
        <Route path="account/device-block" element={<DeviceBlockUnblock />} />
        <Route path="account/user-ban" element={<RoomBanUnban />} />
        <Route path="account/*" element={<AppUsers />} />
        <Route path="static-otp" element={<StaticOtp />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/admin" element={<AdminRequest />} />
        <Route path="requests/agency" element={<AgencyRequest />} />
        <Route path="requests/host" element={<HostRequest />} />
        <Route path="agent/request" element={<AgentRequest />} />
        <Route path="agent/approve-agent" element={<ApproveAgentRequest />} />
        <Route path="agent/online" element={<OnlineAgent />} />
        <Route path="agent/calls" element={<AgentCalls />} />
        <Route path="banner" element={<BannerUpload />} />
        <Route path="gift" element={<GiftUpload />} />
        <Route path="home-image" element={<HomeImageUpload />} />
        <Route path="games" element={<GameList />} />
        <Route path="customizations" element={<Customizations />} />
        {/* <Route path="withdraw/bank" element={<BankWithdraw />} /> */}
        <Route path="withdraw/wallet" element={<WalletWithdraw />} />
        <Route path="reseller/deduct" element={<ResellerCoinDeduction />} />
        <Route path="reseller/summary" element={<ResellerSummary />} />
        <Route path="reseller/create" element={<CreateReseller />} />
        <Route path="reseller/coin-reselling" element={<CoinReselling />} />
        <Route path="reseller/transactions" element={<ResellerTransactions />} />
        <Route path="reseller/admintoresellerTransactions" element={<AdminToResellerTransection />} />
        <Route path="streaming/audio" element={<AudioStreaming />} />
        <Route path="streaming/end-user" element={<EndUserStream />} />
        <Route path="reports/*" element={<Reports />} />
        <Route path="whatsapp-logs" element={<WhatsAppOTPLogs />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="version-update" element={<VersionUpdate />} />
        <Route path="requests/*" element={<AppUsers />} />
        <Route path="agent/*" element={<AppUsers />} />
        <Route path="withdraw/*" element={<AppUsers />} />
        <Route path="reseller/*" element={<AppUsers />} />
        <Route path="custom/*" element={<AppUsers />} />
        <Route path="streaming/*" element={<AppUsers />} />
        <Route path="reports/*" element={<AppUsers />} />
        {/* <Route path="whatsapp-logs" element={<AppUsers />} /> */}
        <Route path="rewards" element={<AppUsers />} />
        <Route path="version-update" element={<AppUsers />} />
      </Route>
    </Routes>
  );
};

// Animated Background Component
const AnimatedBackground = () => (
  <>
    <div className="animated-bg" />
    <div className="particles">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="particle" />
      ))}
    </div>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AnimatedBackground />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
