import { getProductImageUrl } from "../utils/productHelpers";

export default function ProductGallery({
  product,
  images,
  selectedImageIndex,
  onSelectImage,
  onPreviousImage,
  onNextImage,
}) {
  const imageCount = images.length;
  const selectedImage = images[selectedImageIndex];
  const imageUrl = getProductImageUrl(product, selectedImage);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${product.title} — image ${selectedImageIndex + 1}`}
            className="product-detail-image"
          />
        ) : (
          <div className="product-image-placeholder rounded">
            No image available
          </div>
        )}

        {imageCount > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-left"
              onClick={onPreviousImage}
              aria-label="Previous product image"
            >
              &#10094;
            </button>

            <button
              type="button"
              className="gallery-arrow gallery-arrow-right"
              onClick={onNextImage}
              aria-label="Next product image"
            >
              &#10095;
            </button>

            <span className="gallery-counter">
              {selectedImageIndex + 1} / {imageCount}
            </span>
          </>
        )}
      </div>

      {imageCount > 1 && (
        <div
          className="product-thumbnails"
          aria-label="Product image thumbnails"
        >
          {images.map((image, index) => {
            const thumbnailUrl = getProductImageUrl(product, image);

            if (!thumbnailUrl) return null;

            return (
              <button
                type="button"
                key={image.id ?? index}
                className={`product-thumbnail ${
                  selectedImageIndex === index ? "selected" : ""
                }`}
                onClick={() => onSelectImage(index)}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={selectedImageIndex === index}
              >
                <img
                  src={thumbnailUrl}
                  alt={`${product.title} thumbnail ${index + 1}`}
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
