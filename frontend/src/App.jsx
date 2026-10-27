import { Link, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Orders from "./pages/Orders";

function NotFound() {
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6 text-center">
          <div className="mb-3">
            <span className="display-1 fw-bold text-primary" aria-hidden="true">
              404
            </span>
          </div>

          <h1 className="h3 mb-3">Page Not Found</h1>

          <p className="text-muted mb-4">
            Sorry, the page you're looking for doesn't exist or may have been
            moved.
          </p>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>

            <Link to="/products" className="btn btn-outline-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/checkout/success/" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel/" element={<CheckoutCancel />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
