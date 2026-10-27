import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <>
      <Navbar />

      <main className="container py-4">
        <Outlet />
      </main>

      <footer className="bg-light border-top py-3 mt-5">
        <div className="container text-center text-muted">
          <small>
            &copy; {new Date().getFullYear()} Sasta Bazaar. All rights reserved.
          </small>
        </div>
      </footer>
    </>
  );
}
