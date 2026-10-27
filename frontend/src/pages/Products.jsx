import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import "../styles/Products.css";

const INITIAL_FORM = {
  title: "",
  description: "",
  price: "",
  stock_quantity: "",
};

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/products/", {
          signal: controller.signal,
        });

        const data = response.data;
        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        if (!controller.signal.aborted) {
          setProducts(productList);
        }
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          setError(
            err.response?.data?.detail ||
              "Unable to load products. Please check your connection and try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, [retryCount]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    setSelectedImages(files);
    setFormError("");
  }

  function openCreateForm() {
    if (!user) {
      navigate("/login", {
        state: {
          message: "Please log in to add a product.",
          from: "/products",
        },
      });
      return;
    }

    setForm(INITIAL_FORM);
    setSelectedImages([]);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function closeCreateForm() {
    if (submitting) return;

    setShowForm(false);
    setForm(INITIAL_FORM);
    setSelectedImages([]);
    setFormError("");
  }

  async function handleCreateProduct(event) {
    event.preventDefault();

    if (!user) {
      navigate("/login", {
        state: {
          message: "Please log in to add a product.",
          from: "/products",
        },
      });
      return;
    }

    if (submitting) return;

    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const stockQuantity = Number(form.stock_quantity);

    if (!title) {
      setFormError("Product title is required.");
      return;
    }

    if (!description) {
      setFormError("Product description is required.");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Please enter a valid, non-negative price.");
      return;
    }

    if (
      form.stock_quantity.trim() === "" ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setFormError("Stock quantity must be a non-negative whole number.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.post("/api/products/", {
        title,
        description,
        price,
        stock_quantity: stockQuantity,
      });

      const newProduct = response.data;

      if (selectedImages.length > 0) {
        const imageData = new FormData();

        selectedImages.forEach((file) => {
          imageData.append("images", file);
        });

        await api.post(
          `/api/products/${newProduct.id}/upload_image/`,
          imageData,
          {
            headers: {
              "Content-Type": undefined,
            },
          },
        );
      }

      setProducts((previous) => [newProduct, ...previous]);
      setShowForm(false);
      setForm(INITIAL_FORM);
      setSelectedImages([]);
      setSuccessMessage("Product created successfully.");

      navigate(`/products/${newProduct.id}`, {
        state: {
          message: "Product created successfully.",
        },
      });
    } catch (err) {
      const data = err.response?.data;

      const detail =
        data?.detail ||
        data?.title?.[0] ||
        data?.description?.[0] ||
        data?.price?.[0] ||
        data?.stock_quantity?.[0] ||
        data?.images?.[0] ||
        (err.response?.status === 401
          ? "Please log in again to add a product."
          : err.response?.status === 403
            ? "You do not have permission to add a product."
            : "Unable to create the product. Please check your details and try again.");

      setFormError(
        typeof detail === "string"
          ? detail
          : "Please check your product details.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section
        className="container text-center py-5"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading products...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-5">
        <div className="alert alert-danger text-center" role="alert">
          <h2 className="h5">Unable to Load Products</h2>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
        <div>
          <h1>Our Products</h1>
          <p className="text-muted mb-0">
            Browse products available in our store.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="badge text-bg-secondary product-count-badge">
            {products.length} products
          </span>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateForm}
          >
            <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Add Product
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="card shadow-sm mb-5">
          <div className="card-header bg-body py-3">
            <div className="d-flex justify-content-between align-items-center gap-2">
              <h2 className="h4 mb-0">Add a New Product</h2>

              <button
                type="button"
                className="btn-close"
                aria-label="Close form"
                onClick={closeCreateForm}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="card-body p-4">
            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} aria-busy={submitting}>
              <fieldset disabled={submitting}>
                <div className="mb-3">
                  <label htmlFor="product-title" className="form-label">
                    Product Title <span className="text-danger">*</span>
                  </label>
                  <input
                    id="product-title"
                    name="title"
                    type="text"
                    className="form-control"
                    placeholder="Enter product title"
                    value={form.title}
                    onChange={handleFormChange}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="product-description" className="form-label">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="product-description"
                    name="description"
                    className="form-control"
                    rows={4}
                    placeholder="Describe your product"
                    value={form.description}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="product-price" className="form-label">
                      Price ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="product-stock" className="form-label">
                      Stock Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      id="product-stock"
                      name="stock_quantity"
                      type="number"
                      className="form-control"
                      placeholder="Enter available stock"
                      min="0"
                      step="1"
                      value={form.stock_quantity}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3 mb-4">
                  <label htmlFor="product-images" className="form-label">
                    Product Images
                  </label>
                  <input
                    id="product-images"
                    type="file"
                    className="form-control"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <div className="form-text">
                    You can select multiple images. Images are optional.
                  </div>

                  {selectedImages.length > 0 && (
                    <p className="small text-muted mt-2 mb-0">
                      {selectedImages.length} image
                      {selectedImages.length === 1 ? "" : "s"} selected
                    </p>
                  )}
                </div>
              </fieldset>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Creating Product...
                    </>
                  ) : (
                    "Create Product"
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeCreateForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <span className="fs-1" aria-hidden="true">
              &#128722;
            </span>
          </div>

          <h2 className="h4">No Products Available</h2>
          <p className="text-muted">
            There are no products to display right now. You can add the first
            product using the button above.
          </p>

          <button
            type="button"
            className="btn btn-outline-primary mt-2"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Refresh Products
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
