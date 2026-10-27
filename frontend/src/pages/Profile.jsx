import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";

function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [displayPicture, setDisplayPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the latest profile information from Django.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/auth/profile/");

        if (active) {
          setUser(response.data);
          setPhoneNumber(response.data.phone_number || "");
          setAddress(response.data.address || "");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your profile. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [setUser]);

  // Create and clean up a preview URL for the selected image.
  useEffect(() => {
    if (!displayPicture) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(displayPicture);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [displayPicture]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("phone_number", phoneNumber);
      formData.append("address", address);

      if (displayPicture) {
        formData.append("display_picture", displayPicture);
      }

      const response = await api.patch("/api/auth/profile/", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      setUser(response.data);
      setPhoneNumber(response.data.phone_number || "");
      setAddress(response.data.address || "");
      setDisplayPicture(null);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      const data = err.response?.data;

      const message =
        data?.detail ||
        data?.phone_number?.[0] ||
        data?.address?.[0] ||
        data?.display_picture?.[0] ||
        "Unable to update your profile. Please try again.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!user) {
    return (
      <main className="container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            <div className="alert alert-danger" role="alert">
              <h1 className="h5">Unable to load your profile</h1>
              <p className="mb-0">
                {error || "Please log in to access your profile."}
              </p>
            </div>

            <Link to="/login" className="btn btn-primary">
              Login
            </Link>

            <button
              type="button"
              className="btn btn-outline-secondary ms-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const pictureUrl = previewUrl || user.display_picture || "";

  return (
    <main className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h1 className="h2 mb-2">My Profile</h1>

              <p className="text-muted mb-4">
                View your account information and update your personal details.
              </p>

              <AlertMessage message={error} type="danger" />
              <AlertMessage message={success} type="success" />

              <form onSubmit={handleSubmit} aria-busy={saving}>
                <fieldset disabled={saving} className="border-0 p-0 m-0">
                  <legend className="h5 mb-3">Account Information</legend>

                  <div className="mb-3">
                    <label htmlFor="user-id" className="form-label">
                      User ID
                    </label>

                    <input
                      id="user-id"
                      className="form-control"
                      value={user.id ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username
                    </label>

                    <input
                      id="username"
                      className="form-control"
                      value={user.username || ""}
                      readOnly
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      value={user.email || ""}
                      readOnly
                    />
                  </div>

                  <hr className="my-4" />

                  <h2 className="h5 mb-3">Personal Details</h2>

                  <div className="mb-3">
                    <label htmlFor="phone-number" className="form-label">
                      Phone Number
                    </label>

                    <input
                      id="phone-number"
                      name="phone_number"
                      type="tel"
                      className="form-control"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      maxLength={20}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>

                    <textarea
                      id="address"
                      name="address"
                      className="form-control"
                      rows={3}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Enter your address"
                      autoComplete="street-address"
                      maxLength={255}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="display-picture" className="form-label">
                      Display Picture
                    </label>

                    {pictureUrl ? (
                      <div className="mb-3">
                        <img
                          src={pictureUrl}
                          alt="Profile preview"
                          className="rounded-circle border"
                          width="120"
                          height="120"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <p className="text-muted small">
                        No display picture uploaded.
                      </p>
                    )}

                    <input
                      id="display-picture"
                      name="display_picture"
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(event) => {
                        setDisplayPicture(event.target.files?.[0] || null);
                        setError("");
                        setSuccess("");
                      }}
                    />

                    <div className="form-text">
                      Select an image to change your display picture.
                    </div>
                  </div>
                </fieldset>

                <div className="d-flex flex-column flex-sm-row flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Saving changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>

                  <Link to="/" className="btn btn-outline-secondary">
                    Home
                  </Link>

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleLogout}
                    disabled={saving}
                  >
                    Logout
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
