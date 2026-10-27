import { Link } from "react-router-dom";
import {
  getAvailableQuantity,
  getProductImageUrl,
} from "../utils/productHelpers";
import { formatMoney } from "../utils/formatters";

export default function ProductCard({ product }) {
  const available = getAvailableQuantity(product);
  const imageUrl = getProductImageUrl(product);

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={product.id}>
      <Link
        to={`/products/${product.id}`}
        className="product-listing-link"
        aria-label={`View details for ${product.title}`}
      >
        <article className="card h-100 shadow-sm product-listing-card">
          {imageUrl ? (
            <img
              src={imageUrl}
              className="card-img-top product-card-image"
              alt={product.title}
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              <span>No image available</span>
            </div>
          )}

          <div className="card-body d-flex flex-column">
            <h2 className="card-title fs-5">{product.title}</h2>

            <p className="text-muted small mb-2">
              Seller: {product.owner || "Unknown"}
            </p>

            <p className="fs-5 fw-semibold mb-2">
              {formatMoney(product.price)}
            </p>

            <p
              className={`small ${
                available > 0 ? "text-success" : "text-danger"
              }`}
            >
              {available > 0 ? `${available} available` : "Out of Stock"}
            </p>

            <span className="btn btn-primary mt-auto">View Details</span>
          </div>
        </article>
      </Link>
    </div>
  );
}
