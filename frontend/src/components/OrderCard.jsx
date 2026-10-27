import {
  formatDate,
  formatMoney,
  getPaymentStatusClass,
  getStatusClass,
} from "../utils/formatters";

import PaymentCountdown from "./PaymentCountdown";

export default function OrderCard({ order, isBusy, onPay, onCancel }) {
  const canManage = order.status === "pending" || order.status === "failed";

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
        <div>
          <h5 className="mb-1">Order #{order.id}</h5>
          <small className="text-muted">
            Placed {formatDate(order.created_at)}
          </small>
        </div>

        <span className={`badge ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      {canManage && order.created_at && (
        <div className="px-3">
          <PaymentCountdown createdAt={order.created_at} />
        </div>
      )}

      <div className="card-body">
        <h6 className="mb-3">Items</h6>

        {Array.isArray(order.items) && order.items.length > 0 ? (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-end">Price at Purchase</th>
                  <th className="text-end">Line Total</th>
                </tr>
              </thead>

              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_title || "Product unavailable"}</td>

                    <td className="text-center">{item.quantity}</td>

                    <td className="text-end">
                      {formatMoney(item.price_at_purchase)}
                    </td>

                    <td className="text-end">
                      {formatMoney(
                        Number(item.price_at_purchase) * Number(item.quantity),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No item details available.</p>
        )}

        <div className="row justify-content-end mt-3">
          <div className="col-sm-8 col-md-6 col-lg-5">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span>
                Discount
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>

              <span>-{formatMoney(order.discount_amount)}</span>
            </div>

            <hr />

            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>

        {Array.isArray(order.payments) && order.payments.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">Payment Attempts</h6>

            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Attempt</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>

                      <td>
                        <span className={getPaymentStatusClass(payment.status)}>
                          {payment.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td>{formatMoney(payment.amount)}</td>

                      <td>{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {canManage && (
          <div className="d-flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              className="btn btn-primary"
              disabled={isBusy}
              onClick={() => onPay(order)}
            >
              {isBusy ? "Please wait..." : "Pay Again"}
            </button>

            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={isBusy}
              onClick={() => onCancel(order)}
            >
              {isBusy ? "Please wait..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
