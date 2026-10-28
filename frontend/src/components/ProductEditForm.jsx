import { getProductImageUrl } from "../utils/productHelpers";

export default function ProductEditForm({
  product,
  images,
  editForm,
  onChange,
  onSubmit,
  savingProduct,
  deletingProduct,
  onDeleteExistingImage,
  deletingImageIds,
  onImageSelection,
  newImages,
  onRemoveNewImage,
  onClearNewImages,
  onCancel,
}) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body p-4">
        <h2 className="h4 mb-4">Edit Product</h2>

        <form onSubmit={onSubmit} aria-busy={savingProduct}>
          <fieldset disabled={savingProduct || deletingProduct}>
            <div className="mb-3">
              <label htmlFor="edit-title" className="form-label">
                Product Title
              </label>
              <input
                id="edit-title"
                name="title"
                className="form-control"
                value={editForm.title}
                onChange={onChange}
                maxLength={255}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="edit-description" className="form-label">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                className="form-control"
                rows={4}
                value={editForm.description}
                onChange={onChange}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="edit-price" className="form-label">
                Price
              </label>
              <input
                id="edit-price"
                name="price"
                type="number"
                className="form-control"
                min="1"
                step="0.01"
                value={editForm.price}
                onChange={onChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="edit-stock-quantity" className="form-label">
                Stock Quantity
              </label>
              <input
                id="edit-stock-quantity"
                name="stock_quantity"
                type="number"
                className="form-control"
                min="0"
                step="1"
                value={editForm.stock_quantity}
                onChange={onChange}
                required
              />
              <div className="form-text">
                Django will validate stock changes against any existing
                reservations or orders.
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Existing Images</label>

              {images.length > 0 ? (
                <div className="row g-3">
                  {images.map((image, index) => {
                    const existingImageUrl = getProductImageUrl(product, image);

                    return (
                      <div
                        className="col-6 col-sm-4 col-md-3 col-lg-2"
                        key={image.id ?? index}
                      >
                        <div className="position-relative border rounded p-1 h-100">
                          {existingImageUrl ? (
                            <img
                              src={existingImageUrl}
                              alt={`${product.title} image ${index + 1}`}
                              className="img-fluid rounded w-100"
                              style={{
                                height: "140px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center bg-light rounded"
                              style={{ height: "140px" }}
                            >
                              Image unavailable
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 d-flex align-items-center justify-content-center border shadow-sm"
                            style={{
                              width: "30px",
                              height: "30px",
                              transform: "translate(25%, -25%)",
                              padding: 0,
                              color: "#dc3545",
                              backgroundColor: "#fff",
                              zIndex: 2,
                              transition: "background-color 0.2s, color 0.2s",
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.backgroundColor =
                                "#dc3545";
                              event.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.backgroundColor =
                                "#fff";
                              event.currentTarget.style.color = "#dc3545";
                            }}
                            onClick={() => onDeleteExistingImage(image)}
                            disabled={
                              savingProduct ||
                              deletingProduct ||
                              deletingImageIds.includes(image.id)
                            }
                            aria-label={`Delete image ${index + 1}`}
                            title="Delete image"
                          >
                            {deletingImageIds.includes(image.id) ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                aria-hidden="true"
                              />
                            ) : (
                              <i className="bi bi-x-lg" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted mb-0">
                  No images uploaded for this product yet.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="edit-product-images" className="form-label">
                Add New Images
              </label>

              <input
                id="edit-product-images"
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={onImageSelection}
              />

              <div className="form-text">
                You can select multiple images at once or make several
                selections. Previously selected files will be kept.
              </div>

              {newImages.length > 0 && (
                <div className="mt-3">
                  <p className="fw-semibold mb-2">
                    New images selected ({newImages.length})
                  </p>

                  <ul className="list-group">
                    {newImages.map((file, index) => (
                      <li
                        className="list-group-item d-flex justify-content-between align-items-center gap-2"
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      >
                        <span className="text-break">
                          <i className="bi bi-image me-2" aria-hidden="true" />
                          {file.name}
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm flex-shrink-0"
                          onClick={() => onRemoveNewImage(index)}
                          aria-label={`Remove ${file.name} from selected uploads`}
                        >
                          <i className="bi bi-x-lg" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={onClearNewImages}
                  >
                    Clear selected images
                  </button>
                </div>
              )}
            </div>
          </fieldset>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProduct || deletingProduct}
            >
              {savingProduct ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={savingProduct || deletingProduct}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
