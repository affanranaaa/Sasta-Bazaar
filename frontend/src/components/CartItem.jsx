import { formatMoney } from "../utils/formatters";

export default function CartItem({
  item,
  busyItemId,
  isCartBusy,
  onChangeQuantity,
  onRemoveItem,
}) {
  const busy = busyItemId === item.id;
  const available = Number(item.available_quantity ?? 0);
  const quantity = Number(item.quantity);

  const canIncrease = item.available_quantity == null || quantity < available;

  return (
    <div className="list-group-item p-3">
      <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
        <div className="flex-grow-1">
          <h2 className="h6 mb-1">
            {item.product_title || "Product unavailable"}
          </h2>

          <p className="fw-semibold mb-0">
            Line total: {formatMoney(Number(item.product_price) * quantity)}
          </p>

          <p className="fw-semibold mb-0">
            Line total: {formatMoney(Number(item.product_price) * quantity)}
          </p>

          {item.available_quantity != null && (
            <small className={available > 0 ? "text-muted" : "text-danger"}>
              {available > 0 ? `${available} available` : "Out of stock"}
            </small>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label={`Decrease quantity of ${item.product_title}`}
            disabled={isCartBusy || quantity <= 1}
            onClick={() => onChangeQuantity(item, quantity - 1)}
          >
            −
          </button>

          <span
            className="text-center"
            aria-label={`Quantity: ${quantity}`}
            style={{ minWidth: "2rem" }}
          >
            {quantity}
          </span>

          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label={`Increase quantity of ${item.product_title}`}
            disabled={isCartBusy || !canIncrease}
            onClick={() => onChangeQuantity(item, quantity + 1)}
          >
            +
          </button>

          <button
            type="button"
            className="btn btn-outline-danger ms-sm-2"
            disabled={isCartBusy}
            onClick={() => onRemoveItem(item)}
          >
            {busy ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
