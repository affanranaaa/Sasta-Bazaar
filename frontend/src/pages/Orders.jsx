import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { getErrorMessage } from "../utils/formatters";

import OrderCard from "../components/OrderCard";
import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setPageError("");

    try {
      const response = await api.get("/api/orders/", {
        withCredentials: true,
      });

      // Supports a normal DRF list or paginated DRF response.
      const data = response.data;
      const orderList = Array.isArray(data) ? data : data?.results;

      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handlePay(order) {
    setActionError("");
    setMessage("");
    setBusyOrderId(order.id);

    try {
      const response = await api.post(
        `/api/orders/${order.id}/pay/`,
        {},
        { withCredentials: true },
      );

      const checkoutUrl = response.data?.checkout_url;

      if (!checkoutUrl) {
        setActionError("The server did not return a payment URL.");
        return;
      }

      // Redirect the customer to Stripe Checkout.
      window.location.assign(checkoutUrl);
    } catch (error) {
      setActionError(getErrorMessage(error));
      await fetchOrders();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function handleCancel(order) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${order.id}?`,
    );

    if (!confirmed) return;

    setActionError("");
    setMessage("");
    setBusyOrderId(order.id);

    try {
      await api.post(
        `/api/orders/${order.id}/cancel/`,
        {},
        { withCredentials: true },
      );

      setMessage(`Order #${order.id} has been cancelled.`);
      await fetchOrders();
    } catch (error) {
      setActionError(getErrorMessage(error));
      await fetchOrders();
    } finally {
      setBusyOrderId(null);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading your orders..." />;
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="mb-1">My Orders</h1>
          <p className="text-muted mb-0">
            View your purchases and manage unpaid orders.
          </p>
        </div>

        <Link to="/products" className="btn btn-outline-primary">
          Continue Shopping
        </Link>
      </div>

      {pageError && (
        <div className="alert alert-danger" role="alert">
          {pageError}

          <div className="mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <AlertMessage message={actionError} type="danger" />
      <AlertMessage message={message} type="success" />

      {!pageError && orders.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h4>You haven't placed any orders yet.</h4>

            <p className="text-muted">
              Your orders will appear here after you check out.
            </p>

            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isBusy={busyOrderId === order.id}
              onPay={handlePay}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
