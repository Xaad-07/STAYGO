import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import MyProperties from "./pages/MyProperties";
import AddProperty from "./pages/AddProperty";
import EditProperty from "./pages/EditProperty";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import Wishlist from "./pages/Wishlist";
import MyReviews from "./pages/MyReviews";
import CustomerDashboard from "./pages/CustomerDashboard";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import HostDashboard from "./pages/HostDashboard";
import HostBookings from "./pages/HostBookings";
import HostPickupRequests from "./pages/HostPickupRequests";
import HostReviews from "./pages/HostReviews";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminHosts from "./pages/AdminHosts";
import AdminProperties from "./pages/AdminProperties";
import AdminBookings from "./pages/AdminBookings";
import AdminReviews from "./pages/AdminReviews";
import AdminMessages from "./pages/AdminMessages";
import AdminLogs from "./pages/AdminLogs";
import Contact from "./pages/Contact";
import About from "./pages/About";
import BookingDetails from "./pages/BookingDetails";
import Navbar from "./components/Navbar";

// Top-level app component.
// AuthProvider wraps everything so any page can read the logged-in user
// via the useAuth() hook. More routes (Bookings, Dashboards, Admin, etc.)
// will be added as each module is built.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />

          {/* Public property browsing -- no login required. */}
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:propertyId" element={<PropertyDetails />} />

          <Route
            path="/booking-success"
            element={
              <ProtectedRoute requiredRole="customer">
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute requiredRole="customer">
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:bookingId"
            element={
              <ProtectedRoute>
                <BookingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute requiredRole="customer">
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute requiredRole="customer">
                <MyReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Profile and Change Password are shared shells used by any logged-in role. */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Host-only property management pages. */}
          <Route
            path="/host/properties"
            element={
              <ProtectedRoute requiredRole="host">
                <MyProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/properties/add"
            element={
              <ProtectedRoute requiredRole="host">
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/properties/edit/:propertyId"
            element={
              <ProtectedRoute requiredRole="host">
                <EditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/dashboard"
            element={
              <ProtectedRoute requiredRole="host">
                <HostDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/bookings"
            element={
              <ProtectedRoute requiredRole="host">
                <HostBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/pickup-requests"
            element={
              <ProtectedRoute requiredRole="host">
                <HostPickupRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/reviews"
            element={
              <ProtectedRoute requiredRole="host">
                <HostReviews />
              </ProtectedRoute>
            }
          />

          <Route path="/contact" element={<Contact />} />

          {/* Admin-only platform management pages. */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hosts"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminHosts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLogs />
              </ProtectedRoute>
            }
          />

          {/* Any unmatched URL shows a real 404 page, never a blank screen. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
