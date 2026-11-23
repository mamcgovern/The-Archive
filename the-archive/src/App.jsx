
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CollectionProvider } from "./contexts/CollectionContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Activity from "./pages/Activity";
import Wishlist from "./pages/Wishlist";
import AddItem from "./pages/AddItem";
import Login from "./pages/Login";
import "./App.css";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <span>The Archive</span>
        <p>Loading your library...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <CollectionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/activity/:type" element={<Activity />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/add" element={<AddItem />} />

          {/* Redirect old media URLs to the dashboard */}
          <Route path="/movies" element={<Navigate to="/" replace />} />
          <Route path="/video-games" element={<Navigate to="/" replace />} />
          <Route path="/board-games" element={<Navigate to="/" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CollectionProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
