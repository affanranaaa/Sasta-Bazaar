import { Link } from "react-router-dom";

export default function CheckoutSuccess() {
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center p-4 p-md-5">
              <div className="mb-4">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success"
                  style={{
                    width: "76px",
                    height: "76px",
                    fontSize: "38px",
                  }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </div>

              <h1 className="h2 mb-3">Checkout Completed</h1>

              <p className="text-muted mb-4">
                You've returned from Stripe Checkout. Your payment is being
                confirmed, and your order status may take a little time to
                update. You can check the latest status in My Orders.
              </p>

              <div className="alert alert-success text-start" role="status">
                <strong>What's next?</strong> Check My Orders to verify that
                your payment has been confirmed before assuming the order is
                paid.
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mt-4">
                <Link to="/orders" className="btn btn-primary">
                  View My Orders
                </Link>

                <Link to="/products" className="btn btn-outline-secondary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
