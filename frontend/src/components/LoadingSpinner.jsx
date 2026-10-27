export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      className="container py-5 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner-border" aria-hidden="true" />

      <p className="text-muted mt-3 mb-0">{message}</p>
    </div>
  );
}
