import { Link, NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav style={{
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      borderBottom: "1px solid #ccc",
    }}>
      <Link to="/"><strong>Taller</strong></Link>
      <NavLink to="/" end>Órdenes</NavLink>
      <NavLink to="/ordenes/nueva">Nueva orden</NavLink>
    </nav>
  );
}