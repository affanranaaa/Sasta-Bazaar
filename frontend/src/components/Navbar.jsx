import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import api from "../api/axios";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOrdersPage = location.pathname === "/orders";

  const [pendingFailedCount, setPendingFailedCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setPendingFailedCount(0);
      return;
    }

    let isMounted = true;

    async function fetchOrdersCount() {
      try {
        const response = await api.get("/api/orders/");

        const orders = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.results)
            ? response.data.results
            : [];

        const count = orders.filter((order) =>
          ["pending", "failed"].includes(order.status?.trim().toLowerCase()),
        ).length;

        if (isMounted) {
          setPendingFailedCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch orders count:", error);

        // Prevent an old count from leaving a stale badge visible.
        if (isMounted) {
          setPendingFailedCount(0);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchOrdersCount();
      }
    }

    fetchOrdersCount();

    // Refresh when the user returns to this browser tab.
    window.addEventListener("focus", fetchOrdersCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", fetchOrdersCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function getLinkClass({ isActive }) {
    return `nav-link ${isActive ? "active fw-semibold" : ""}`;
  }

  const username = user?.username || "User";
  const firstLetter = username.charAt(0).toUpperCase();
  const displayPicture = user?.display_picture;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <img src="/logo-2.png" alt="Sasta Bazaar" className="navbar-logo" />
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={getLinkClass} to="/" end>
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={getLinkClass} to="/products">
                Products
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={getLinkClass} to="/cart">
                Cart
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={getLinkClass} to="/orders">
                My Orders
                {user && pendingFailedCount > 0 && !isOrdersPage && (
                  <span
                    className="badge rounded-pill bg-danger ms-2"
                    aria-label={`${pendingFailedCount} pending or failed orders`}
                  >
                    {pendingFailedCount}
                  </span>
                )}
              </NavLink>
            </li>
          </ul>

          <div className="navbar-search-wrapper">
            <SearchBar />
          </div>

          <ul className="navbar-nav align-items-lg-center gap-lg-2 mt-3 mt-lg-0">
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink to="/profile" className={getLinkClass}>
                    {displayPicture ? (
                      <img
                        src={displayPicture}
                        alt={`${username}'s profile`}
                        className="rounded-circle border me-2"
                        style={{
                          width: "36px",
                          height: "36px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span
                        className="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary text-white fw-bold me-2"
                        style={{
                          width: "36px",
                          height: "36px",
                          flexShrink: 0,
                        }}
                        aria-label={`${username}'s avatar`}
                      >
                        {firstLetter}
                      </span>
                    )}

                    <span>Hi, {username}</span>
                  </NavLink>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={getLinkClass} to="/login">
                    Login
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="btn btn-primary btn-sm" to="/signup">
                    Sign Up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
