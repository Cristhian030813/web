import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";

export default function Layout() {
  return (
    <>
      <NavBar />
      <main style={{ padding: "1rem", maxWidth: 1000, margin: "0 auto" }}>
        <Outlet />
      </main>
    </>
  );
}