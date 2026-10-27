import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getAvailableQuantity } from "../utils/productHelpers";
import CommentsSection from "../components/CommentsSection";
import ProductGallery from "../components/ProductGallery";
import ProductEditForm from "../components/ProductEditForm";
import { formatMoney } from "../utils/formatters";
import "../styles/ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [editing, setEditing] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [deletingImageIds, setDeletingImageIds] = useState([]);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    stock_quantity: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedImageIndex(0);
      setQuantity(1);
      setCartMessage("");
      setEditing(false);
      setNewImages([]);
      setDeletingImageIds([]);

      try {
        const response = await api.get(`/api/products/${id}/`, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProduct(response.data);
        }
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          setError(
            err.response?.status === 404
              ? "This product could not be found. It may have been removed."
              : err.response?.data?.detail ||
                  "Unable to load this product. Please check your connection and try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [id, retryCount]);

  const isOwner =
    user?.id != null &&
    product?.owner_id != null &&
    String(user.id) === String(product.owner_id);

  function startEditing() {
    setEditForm({
      title: product.title || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock_quantity: String(product.stock_quantity ?? ""),
    });

    setNewImages([]);
    setError("");
    setCartMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setNewImages([]);
    setError("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageSelection(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > 0) {
      setNewImages((previous) => [...previous, ...selectedFiles]);
      setError("");
    }

    // Allows the user to select the same file again if needed.
    event.target.value = "";
  }

  function handleRemoveNewImage(indexToRemove) {
    setNewImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
  }

  async function handleDeleteExistingImage(image) {
    if (
      !isOwner ||
      savingProduct ||
      deletingProduct ||
      deletingImageIds.includes(image.id)
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product image? This action cannot be undone.",
    );

    if (!confirmed) return;

    setError("");
    setDeletingImageIds((previous) => [...previous, image.id]);

    try {
      await api.delete(`/api/products/${product.id}/images/${image.id}/`);

      setProduct((previous) => ({
        ...previous,
        images: (previous.images || []).filter(
          (existingImage) => existingImage.id !== image.id,
        ),
      }));

      setSelectedImageIndex(0);
      setCartMessage("Product image deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to delete this image. Please try again.",
      );
    } finally {
      setDeletingImageIds((previous) =>
        previous.filter((imageId) => imageId !== image.id),
      );
    }
  }

  async function handleSaveProduct(event) {
    event.preventDefault();

    if (savingProduct || !isOwner) return;

    setError("");
    setCartMessage("");

    const price = Number(editForm.price);
    const stockQuantity = Number(editForm.stock_quantity);

    if (!editForm.title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (editForm.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid, non-negative price.");
      return;
    }

    if (
      editForm.stock_quantity.trim() === "" ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError("Stock quantity must be a non-negative whole number.");
      return;
    }

    setSavingProduct(true);

    let productDetailsSaved = false;

    try {
      const response = await api.patch(`/api/products/${product.id}/`, {
        title: editForm.title.trim(),
        description: editForm.description,
        price,
        stock_quantity: stockQuantity,
      });

      setProduct(response.data);
      productDetailsSaved = true;

      if (newImages.length > 0) {
        const imageData = new FormData();

        newImages.forEach((file) => {
          imageData.append("images", file);
        });

        await api.post(`/api/products/${product.id}/upload_image/`, imageData, {
          headers: {
            "Content-Type": undefined,
          },
        });

        setNewImages([]);
      }

      // Refresh the product so the gallery includes any newly uploaded images.
      const refreshedProduct = await api.get(`/api/products/${product.id}/`);

      setProduct(refreshedProduct.data);
      setSelectedImageIndex(0);
      setEditing(false);
      setError("");
      setCartMessage("Product updated successfully.");
    } catch (err) {
      const data = err.response?.data;

      if (productDetailsSaved) {
        setError(
          "Product details were saved, but the new images could not be uploaded or the updated product could not be reloaded. Please check the error and try again.",
        );
      } else {
        setError(
          data?.detail ||
            data?.title?.[0] ||
            data?.description?.[0] ||
            data?.price?.[0] ||
            data?.stock_quantity?.[0] ||
            "Unable to update the product. Please try again.",
        );
      }
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct() {
    if (deletingProduct || !isOwner) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingProduct(true);
    setError("");

    try {
      await api.delete(`/api/products/${product.id}/`);

      navigate("/products", {
        replace: true,
        state: { message: "Product deleted successfully." },
      });
    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.detail ||
          data?.error ||
          "Unable to delete the product. It may have active orders or reservations.",
      );
    } finally {
      setDeletingProduct(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;

    const available = getAvailableQuantity(product);

    if (available < 1) {
      setError("This product is currently out of stock.");
      return;
    }

    if (
      quantity === "" ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      Number(quantity) > available
    ) {
      setError(
        `Please select a whole-number quantity between 1 and ${available}.`,
      );
      return;
    }

    setAddingToCart(true);
    setError("");
    setCartMessage("");

    try {
      const response = await api.post(
        `/api/cart/add/${product.id}/`,
        { quantity: Number(quantity) },
        { withCredentials: true },
      );

      const message = response.data?.message || "Product added to your cart.";

      setCartMessage(message);

      navigate("/cart", {
        state: { message },
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to add this product to your cart. Please try again.",
      );
    } finally {
      setAddingToCart(false);
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
        <p className="mt-3 text-muted">Loading product details...</p>
      </section>
    );
  }

  if (error && !product) {
    return (
      <section className="container py-5">
        <div className="alert alert-danger text-center" role="alert">
          <h1 className="h4">Unable to Load Product</h1>
          <p>{error}</p>

          {error.startsWith("This product could not be found.") ? (
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          ) : (
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try Again
              </button>

              <Link to="/products" className="btn btn-outline-primary">
                Back to Products
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container text-center py-5">
        <p className="text-muted">Product details are unavailable.</p>
        <Link to="/products" className="btn btn-outline-primary">
          Browse Products
        </Link>
      </section>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const available = getAvailableQuantity(product);

  function showPreviousImage() {
    setSelectedImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNextImage() {
    setSelectedImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <section className="container py-4">
      <div className="mb-4">
        <Link to="/products" className="text-decoration-none">
          &larr; Back to Products
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {cartMessage && (
        <div className="alert alert-success" role="status">
          {cartMessage}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
        <h1 className="mb-0">{product.title}</h1>

        {isOwner && (
          <div className="d-flex gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-outline-primary py-2"
              onClick={editing ? cancelEditing : startEditing}
              disabled={savingProduct || deletingProduct}
            >
              <i className="bi bi-pencil-square me-1" aria-hidden="true"></i>
              {editing ? "Cancel" : "Edit"}
            </button>

            <button
              type="button"
              className="btn btn-outline-danger py-2"
              onClick={handleDeleteProduct}
              disabled={deletingProduct || savingProduct}
            >
              <i className="bi bi-trash me-1" aria-hidden="true"></i>
              {deletingProduct ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {editing && isOwner && (
        <ProductEditForm
          product={product}
          images={images}
          editForm={editForm}
          onChange={handleEditChange}
          onSubmit={handleSaveProduct}
          savingProduct={savingProduct}
          deletingProduct={deletingProduct}
          onDeleteExistingImage={handleDeleteExistingImage}
          deletingImageIds={deletingImageIds}
          onImageSelection={handleImageSelection}
          newImages={newImages}
          onRemoveNewImage={handleRemoveNewImage}
          onClearNewImages={() => setNewImages([])}
          onCancel={cancelEditing}
        />
      )}

      <div className="row g-4 g-lg-5">
        <div className="col-12 col-md-6">
          <ProductGallery
            product={product}
            images={images}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            onPreviousImage={showPreviousImage}
            onNextImage={showNextImage}
          />
        </div>

        <div className="col-12 col-md-6">
          <h1>{product.title}</h1>

          <p className="text-muted">Seller: {product.owner || "Unknown"}</p>

          <p className="fs-3 fw-semibold">{formatMoney(product.price)}</p>

          <p className="text-secondary">
            {product.description || "No description available."}
          </p>

          <p className={available > 0 ? "text-success" : "text-danger"}>
            {available > 0 ? `${available} available` : "Out of Stock"}
          </p>

          {available > 0 ? (
            <>
              <div className="mb-3" style={{ maxWidth: "160px" }}>
                <label htmlFor="product-quantity" className="form-label">
                  Quantity
                </label>

                <input
                  id="product-quantity"
                  type="number"
                  className="form-control"
                  min="1"
                  max={available}
                  step="1"
                  value={quantity}
                  disabled={addingToCart}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuantity(value === "" ? "" : Number(value));
                    setError("");
                    setCartMessage("");
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  quantity === "" ||
                  !Number.isInteger(Number(quantity)) ||
                  Number(quantity) < 1 ||
                  Number(quantity) > available
                }
              >
                {addingToCart ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Adding...
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" disabled>
              Out of Stock
            </button>
          )}
        </div>
      </div>

      <CommentsSection productId={product.id} ownerId={product.owner_id} />
    </section>
  );
}
