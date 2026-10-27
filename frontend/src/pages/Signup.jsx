import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertMessage from "../components/AlertMessage";

function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register(form);

      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please log in." },
      });
    } catch (err) {
      const data = err.response?.data;

      setError(
        Object.values(data || {})
          .flat()
          .join(" ") || "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h1 className="h2 text-center mb-4">Create an Account</h1>

              <form onSubmit={handleSubmit} aria-busy={submitting}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="form-control"
                    value={form.username}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password2" className="form-label">
                    Confirm Password
                  </label>

                  <input
                    id="password2"
                    name="password2"
                    type="password"
                    className="form-control"
                    value={form.password2}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />
                </div>

                <AlertMessage message={error} type="danger" />

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Creating account...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Already registered? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Signup;
