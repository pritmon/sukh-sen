import { Routes, Route, Navigate } from 'react-router-dom';
import Layout       from './components/Layout.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Appointments from './pages/Appointments.jsx';
import Customers    from './pages/Customers.jsx';
import Services     from './pages/Services.jsx';
import Billing      from './pages/Billing.jsx';
import Staff        from './pages/Staff.jsx';
import Inventory    from './pages/Inventory.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/customers"    element={<Customers />} />
        <Route path="/services"     element={<Services />} />
        <Route path="/billing"      element={<Billing />} />
        <Route path="/staff"        element={<Staff />} />
        <Route path="/inventory"    element={<Inventory />} />
      </Route>
    </Routes>
  );
}
