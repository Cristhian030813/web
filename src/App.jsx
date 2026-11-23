import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ListaOrdenes from "./pages/ListaOrdenes.jsx";
import DetalleOrden from "./pages/DetalleOrden.jsx";
import NuevaOrden from "./pages/NuevaOrden.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ListaOrdenes />} />
        <Route path="ordenes/nueva" element={<NuevaOrden />} />
        <Route path="ordenes/:id" element={<DetalleOrden />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}