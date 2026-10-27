import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/SearchBar.css";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const searchQuery = query.trim();

    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/search/", {
          params: { q: searchQuery },
          signal: controller.signal,
        });

        const data = response.data;
        const products = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.products)
              ? data.products
              : [];

        setResults(products);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          setResults([]);
          setError(
            err.response?.data?.detail || "Search failed. Please try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleChange(event) {
    setQuery(event.target.value);
    setIsOpen(true);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setError("");
    setIsOpen(false);
  }

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div className="live-search">
      <form
        className="live-search-form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="text"
          className="form-control live-search-input"
          placeholder="Search products..."
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-controls="live-search-results"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />

        {query && (
          <button
            type="button"
            className="live-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </form>

      {showDropdown && (
        <div id="live-search-results" className="live-search-dropdown">
          {loading ? (
            <div className="live-search-status">
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Searching...
            </div>
          ) : error ? (
            <div className="live-search-status text-danger">{error}</div>
          ) : results.length === 0 ? (
            <div className="live-search-status">
              No matching products found.
            </div>
          ) : (
            <ul className="list-unstyled mb-0">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/products/${product.id}`}
                    className="live-search-result"
                    onClick={handleClear}
                  >
                    <span className="live-search-product-title">
                      {product.title}
                    </span>

                    {product.price != null && (
                      <span className="live-search-product-price">
                        $ {Number(product.price).toLocaleString()}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
