import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { getErrorMessage } from "../utils/formatters";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    discount_amount: 0,
    total: 0,
    coupon_code: null,
    coupon_percent: 0,
  });

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const isCartBusy = busyItemId !== null || couponBusy || checkoutBusy;

  const loadCart = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setPageError("");

    try {
      const response = await api.get("/api/cart/", {
        withCredentials: true,
      });

      const data = response.data;

      setCart({
        ...data,
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: data.subtotal ?? 0,
        discount_amount: data.discount_amount ?? 0,
        total: data.total ?? 0,
        coupon_code: data.coupon_code ?? null,
        coupon_percent: data.coupon_percent ?? 0,
      });

      setCouponInput(data.coupon_code ?? "");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function changeQuantity(item, quantity) {
    if (isCartBusy || quantity < 1) return;

    if (
      item.available_quantity != null &&
      quantity > Number(item.available_quantity)
    ) {
      setActionError(
        `Only ${item.available_quantity} units of "${item.product_title}" are available.`,
      );
      return;
    }

    setBusyItemId(item.id);
    setPageError("");
    setActionError("");
    setMessage("");

    try {
      await api.post(
        `/api/cart/update/${item.id}/`,
        { quantity },
        { withCredentials: true },
      );

      await loadCart(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
      await loadCart(false);
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(item) {
    if (isCartBusy) return;

    setBusyItemId(item.id);
    setPageError("");
    setActionError("");
    setMessage("");

    try {
      await api.post(
        `/api/cart/remove/${item.id}/`,
        {},
        { withCredentials: true },
      );

      setMessage(`${item.product_title} removed from your cart.`);
      await loadCart(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
      await loadCart(false);
    } finally {
      setBusyItemId(null);
    }
  }

  async function applyCoupon(event) {
    event.preventDefault();

    if (isCartBusy) return;

    if (!couponInput.trim()) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setCouponBusy(true);
    setPageError("");
    setActionError("");
    setCouponError("");
    setMessage("");

    try {
      await api.post(
        "/api/cart/apply-coupon/",
        { coupon_code: couponInput.trim() },
        { withCredentials: true },
      );

      await loadCart(false);
      setMessage("Coupon applied successfully.");
    } catch (error) {
      setCouponError(getErrorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  }

  async function removeCoupon() {
    if (isCartBusy) return;

    setCouponBusy(true);
    setPageError("");
    setActionError("");
    setCouponError("");
    setMessage("");

    try {
      await api.post("/api/cart/remove-coupon/", {}, { withCredentials: true });

      setCouponInput("");
      await loadCart(false);
      setMessage("Coupon removed.");
    } catch (error) {
      setCouponError(getErrorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  }

  async function handleCheckout() {
    if (isCartBusy) return;

    setPageError("");
    setActionError("");
    setMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (cart.items.length === 0) {
      setPageError("Your cart is empty.");
      return;
    }

    setCheckoutBusy(true);

    try {
      const response = await api.post(
        "/api/checkout/",
        {
          coupon_code: cart.coupon_code || null,
        },
        { withCredentials: true },
      );

      const checkoutUrl = response.data?.checkout_url;
      const orderId = response.data?.order_id;

      if (checkoutUrl) {
        // Redirect the customer to Stripe Checkout.
        window.location.assign(checkoutUrl);
        return;
      }

      if (orderId) {
        setPageError(
          response.data?.detail ||
            "Your order was created, but payment could not start. Please try again from My Orders.",
        );
        return;
      }

      setPageError("Checkout did not return a payment URL.");
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setPageError(getErrorMessage(error));
    } finally {
      setCheckoutBusy(false);
    }
  }

  if (loading) {
    return (
      <div
        className="container py-5 text-center"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <p className="mt-3 text-muted">Loading your cart...</p>
      </div>
    );
  }

  return (
    <main className="container py-4 py-md-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h2 mb-0">Shopping Cart</h1>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => loadCart()}
            disabled={isCartBusy}
          >
            Refresh Cart
          </button>

          <Link to="/products" className="btn btn-outline-secondary">
            Continue shopping
          </Link>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{pageError}</p>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => loadCart()}
            disabled={isCartBusy}
          >
            Try Again
          </button>
        </div>
      )}

      {actionError && (
        <div className="alert alert-danger" role="alert">
          <strong>Action failed:</strong> {actionError}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {!pageError && cart.items.length === 0 ? (
        <div className="text-center border rounded p-5">
          <div className="fs-1 mb-3" aria-hidden="true">
            🛒
          </div>

          <h2 className="h4">Your cart is empty</h2>

          <p className="text-muted">
            Browse our products and add something you like.
          </p>

          <Link to="/products" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      ) : cart.items.length > 0 ? (
        <div className="row g-4">
          <section className="col-lg-8" aria-label="Cart items">
            <div className="card">
              <div className="list-group list-group-flush">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    busyItemId={busyItemId}
                    isCartBusy={isCartBusy}
                    onChangeQuantity={changeQuantity}
                    onRemoveItem={removeItem}
                  />
                ))}
              </div>
            </div>
          </section>

          <OrderSummary
            cart={cart}
            user={user}
            couponInput={couponInput}
            couponError={couponError}
            couponBusy={couponBusy}
            isCartBusy={isCartBusy}
            checkoutBusy={checkoutBusy}
            onCouponInputChange={(value) => {
              setCouponInput(value);
              setCouponError("");
            }}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            onCheckout={handleCheckout}
          />
        </div>
      ) : null}
    </main>
  );
}
