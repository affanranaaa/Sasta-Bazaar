import { formatMoney } from "../utils/formatters";

export default function OrderSummary({
  cart,
  user,
  couponInput,
  couponError,
  couponBusy,
  isCartBusy,
  checkoutBusy,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}) {
  return (
    <aside className="col-lg-4" aria-label="Order summary">
      <div className="card">
        <div className="card-body">
          <h2 className="h5 mb-3">Order Summary</h2>

          <form onSubmit={onApplyCoupon} className="mb-3">
            <label htmlFor="coupon-code" className="form-label">
              Coupon code
            </label>

            <div className="input-group">
              <input
                id="coupon-code"
                className="form-control"
                value={couponInput}
                onChange={(event) => onCouponInputChange(event.target.value)}
                placeholder="Enter code"
                disabled={isCartBusy || Boolean(cart.coupon_code)}
              />

              {cart.coupon_code ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={onRemoveCoupon}
                  disabled={isCartBusy}
                >
                  {couponBusy ? "Please wait..." : "Remove"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-outline-primary"
                  disabled={isCartBusy}
                >
                  {couponBusy ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        aria-hidden="true"
                      />
                      Applying...
                    </>
                  ) : (
                    "Apply"
                  )}
                </button>
              )}
            </div>

            {couponError && (
              <div className="text-danger small mt-2" role="alert">
                {couponError}
              </div>
            )}

            {cart.coupon_code && (
              <div className="text-success small mt-2" role="status">
                {cart.coupon_code} applied
                {cart.coupon_percent ? ` (${cart.coupon_percent}% off)` : ""}
              </div>
            )}
          </form>

          <hr />

          <div className="d-flex justify-content-between mb-2">
            <span>Subtotal</span>
            <span>{formatMoney(cart.subtotal)}</span>
          </div>

          <div className="d-flex justify-content-between mb-2 text-success">
            <span>Discount</span>
            <span>− {formatMoney(cart.discount_amount)}</span>
          </div>

          <hr />

          <div className="d-flex justify-content-between fw-bold fs-5">
            <span>Total</span>
            <span>{formatMoney(cart.total)}</span>
          </div>

          {!user && (
            <p className="text-muted small mt-3 mb-0">
              You need to log in before placing your order.
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary w-100 mt-4"
            onClick={onCheckout}
            disabled={isCartBusy || cart.items.length === 0}
          >
            {checkoutBusy ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                Starting checkout...
              </>
            ) : user ? (
              "Proceed to Checkout"
            ) : (
              "Login to Checkout"
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
