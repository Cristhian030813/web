import { Link, useParams } from "react-router-dom";
import { useOrden } from "../hooks/useOrden.js";
import { urlArchivo } from "../api/pocketbase.js";
import EstadoBadge from "../components/EstadoBadge.jsx";
import HistorialEventos from "../components/HistorialEventos.jsx";
import AccionesOrden from "../components/AccionesOrden.jsx";

export default function DetalleOrden() {
  const { id } = useParams();
  const { orden, eventos, cargando, error, recargar } = useOrden(id);

  if (cargando) return <p>Cargando…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!orden) return <p>No se encontró la orden.</p>;

  const cliente = orden.expand?.cliente;
  const fotos = orden.fotos || [];

  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      <div>
        <Link to="/">← Volver al listado</Link>
      </div>

      {/* ─── Cabecera ─── */}
      <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>{orden.equipo}</h1>
        <EstadoBadge estado={orden.estado} />
      </header>

      {/* ─── Datos ─── */}
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          rowGap: "0.4rem",
          columnGap: "0.75rem",
        }}
      >
        <dt><strong>Cliente</strong></dt>
        <dd style={{ margin: 0 }}>
          {cliente ? `${cliente.nombre} · ${cliente.telefono}` : "—"}
        </dd>

        <dt><strong>Problema</strong></dt>
        <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{orden.problema}</dd>

        <dt><strong>Registrada</strong></dt>
        <dd style={{ margin: 0 }}>{new Date(orden.created).toLocaleString()}</dd>

        {orden.diagnostico && (
          <>
            <dt><strong>Diagnóstico</strong></dt>
            <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{orden.diagnostico}</dd>
          </>
        )}
      </dl>

      {/* ─── Fotos ─── */}
      {fotos.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Fotos</h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {fotos.map((nombre) => (
              <li key={nombre}>
                <a href={urlArchivo(orden, nombre)} target="_blank" rel="noreferrer">
                  <img
                    src={urlArchivo(orden, nombre)}
                    alt={nombre}
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

            {/* ─── Historial ─── */}
      <section>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Historial</h2>
        <HistorialEventos eventos={eventos} />
      </section>

      {/* ─── Acciones ─── */}
      <AccionesOrden orden={orden} onCambio={recargar} />
    </section>
  


      {/* ─── Placeholder de acciones (se implementa en 4.3 / 4.4) ─── */}
      <section
        style={{
          border: "1px dashed #aaa",
          borderRadius: 6,
          padding: "0.75rem",
          color: "#666",
        }}
      >
        Las acciones (presupuestar, aprobar, reparar…) se activarán en los
        siguientes sub‑pasos.
      </section>
    </section>
  );
}