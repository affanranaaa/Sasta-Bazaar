import { Link } from "react-router-dom";

export default function CheckoutCancel() {
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center p-4 p-md-5">
              <div className="mb-4">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis"
                  style={{
                    width: "76px",
                    height: "76px",
                    fontSize: "38px",
                  }}
                  aria-hidden="true"
                >
                  !
                </span>
              </div>

              <h1 className="h2 mb-3">Checkout Cancelled</h1>

              <p className="text-muted mb-4">
                You cancelled or left the Stripe Checkout page before completing
                your payment. Your order may still exist with a pending payment.
                You can visit My Orders to try paying again or cancel the order.
              </p>

              <div className="alert alert-warning text-start" role="status">
                <strong>Important:</strong> Leaving checkout does not
                necessarily cancel your order.
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
