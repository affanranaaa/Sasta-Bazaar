export default function AlertMessage({
  message,
  type = "danger",
  role,
  children,
}) {
  if (!message && !children) {
    return null;
  }

  const alertRole = role || (type === "success" ? "status" : "alert");

  return (
    <div className={`alert alert-${type}`} role={alertRole}>
      {message || children}
    </div>
  );
}
