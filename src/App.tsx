import { HashRouter, Routes, Route } from 'react-router-dom';
import Checkout from './Checkout';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminContent from './pages/AdminContent';
import AdminRaffles from './pages/AdminRaffles';
import AdminRaffleDetails from './pages/AdminRaffleDetails';

import Home from './Home';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout/:id" element={<Checkout />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="raffles" element={<AdminRaffles />} />
          <Route path="raffles/:id" element={<AdminRaffleDetails />} />
          <Route path="content" element={<AdminContent />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
