const API_BASE_URL = import.meta.env.VITE_API_URL;

export function getAvailableQuantity(product) {
  if (product.available_quantity != null) {
    return Math.max(Number(product.available_quantity), 0);
  }

  if (product.reserved_quantity != null) {
    return Math.max(
      Number(product.stock_quantity ?? 0) - Number(product.reserved_quantity),
      0,
    );
  }

  return Math.max(Number(product.stock_quantity ?? 0), 0);
}

export function getProductImageUrl(product, image = product.images?.[0]) {
  const imageValue =
    typeof image === "string"
      ? image
      : (image?.image_url ?? image?.image ?? image?.url);

  if (!imageValue) {
    return null;
  }

  try {
    return new URL(imageValue, `${API_BASE_URL}/`).href;
  } catch {
    return null;
  }
}
