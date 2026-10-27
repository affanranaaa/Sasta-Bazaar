import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { getProductImageUrl } from "../utils/productHelpers";
import { formatMoney } from "../utils/formatters";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Home.css";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products/")
      .then((response) => {
        const data = response.data;
        const productList = Array.isArray(data) ? data : data.results || [];
        setProducts(productList.slice(0, 4));
      })
      .catch((error) => {
        console.error("Failed to load featured products:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="home-page">
      <section className="home-intro">
        <h1>Welcome to Sasta Bazaar</h1>

        <p>
          Discover everyday essentials and great products at prices you'll love.
          Simple shopping, great value, all in one place.
        </p>

        <Link to="/products" className="shop-now-btn">
          Shop Now
        </Link>
      </section>

      <section className="featured-section">
        <h2>Featured Products</h2>
        <p className="featured-subtitle">
          Take a look at some of our products.
        </p>

        {loading ? (
          <LoadingSpinner message="Loading featured products..." />
        ) : products.length === 0 ? (
          <p>No products available right now.</p>
        ) : (
          <div className="featured-products">
            {products.map((product) => (
              <Link
                to={`/products/${product.id}`}
                className="featured-product"
                key={product.id}
              >
                <img src={getProductImageUrl(product)} alt={product.title} />

                <h3>{product.title}</h3>

                <p>{formatMoney(product.price)}</p>
              </Link>
            ))}
          </div>
        )}

        <Link to="/products" className="view-products-link">
          View All Products →
        </Link>
      </section>
    </main>
  );
}

export default Home;
