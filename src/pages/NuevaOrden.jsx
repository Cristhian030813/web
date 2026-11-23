import { Link } from "react-router-dom";
import FormularioOrden from "../components/FormularioOrden.jsx";

export default function NuevaOrden() {
  return (
    <section>
      <Link to="/">← Volver al listado</Link>
      <FormularioOrden />
    </section>
  );
}