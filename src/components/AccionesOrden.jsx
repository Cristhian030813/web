import { useState } from "react";
import { actualizar } from "../api/pocketbase.js";
import FormularioPresupuesto from "./FormularioPresupuesto.jsx";

// Estados en los que la orden ya no admite más cambios
const FINALES = ["rechazada", "cancelada", "entregada"];

// Botones simples por estado (las transiciones que no necesitan formulario)
const BOTONES_POR_ESTADO = {
  solicitada: [
    { estado: "en_diagnostico", label: "Iniciar diagnóstico", color: "#0a7" },
    { estado: "cancelada", label: "Cancelar", color: "#555" },
  ],
  presupuestada: [
    { estado: "aprobada", label: "Aprobar", color: "#0a0" },
    { estado: "rechazada", label: "Rechazar", color: "#c00" },
  ],
  aprobada: [
    { estado: "en_reparacion", label: "Iniciar reparación", color: "#c80" },
  ],
  en_reparacion: [
    { estado: "lista", label: "Marcar como lista", color: "#08a" },
  ],
  lista: [
    { estado: "entregada", label: "Entregar", color: "#060" },
  ],
};

export default function AccionesOrden({ orden, onCambio }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────
  // Transición simple: solo cambia el estado
  // ─────────────────────────────────────────────
  async function transicionar(nuevoEstado) {
    if (enviando) return; // 🛡️ guard: evita doble clic
    setError(null);
    setEnviando(true);
    try {
      await actualizar("ordenes", orden.id, { estado: nuevoEstado });
      onCambio?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  // ─────────────────────────────────────────────
  // 1) Estado final → no hay acciones
  // ─────────────────────────────────────────────
  if (FINALES.includes(orden.estado)) {
    return (
      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "0.75rem",
          color: "#555",
        }}
      >
        La orden está cerrada ({orden.estado}). No admite más cambios.
      </section>
    );
  }

  // ─────────────────────────────────────────────
  // 2) en_diagnostico → formulario de presupuesto
  // ─────────────────────────────────────────────
  if (orden.estado === "en_diagnostico") {
    return <FormularioPresupuesto orden={orden} onGuardado={onCambio} />;
  }

  // ─────────────────────────────────────────────
  // 3) Resto de estados → botones simples
  // ─────────────────────────────────────────────
  const botones = BOTONES_POR_ESTADO[orden.estado] || [];

  return (
    <section style={{ display: "grid", gap: "0.5rem" }}>
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Acciones</h2>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {botones.map((b) => (
          <button
            key={b.estado}
            onClick={() => transicionar(b.estado)}
            disabled={enviando}
            style={{
              background: b.color,
              color: "#fff",
              padding: "0.5rem 1rem",
              border: 0,
              borderRadius: 4,
              cursor: enviando ? "wait" : "pointer",
              opacity: enviando ? 0.7 : 1,
            }}
          >
            {enviando ? "Procesando…" : b.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
    </section>
  );
}