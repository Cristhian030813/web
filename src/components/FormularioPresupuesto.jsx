import { memo, useCallback, useMemo, useState } from "react";
import { actualizar } from "../api/pocketbase.js";

// ─────────────────────────────────────────────
// Fila de pieza (memoizada)
// ─────────────────────────────────────────────
const PiezaRow = memo(function PiezaRow({ pieza, index, onCambiar, onEliminar }) {
  const subtotal = (Number(pieza.cantidad) || 0) * (Number(pieza.precio) || 0);

  return (
    <tr>
      <td>
        <input
          type="text"
          value={pieza.descripcion}
          onChange={(e) => onCambiar(index, "descripcion", e.target.value)}
          placeholder="Ej: pantalla, batería…"
          style={{ width: "100%", padding: "0.3rem" }}
        />
      </td>
      <td>
        <input
          type="number"
          min="1"
          value={pieza.cantidad}
          onChange={(e) => onCambiar(index, "cantidad", e.target.value)}
          style={{ width: 70, padding: "0.3rem" }}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={pieza.precio}
          onChange={(e) => onCambiar(index, "precio", e.target.value)}
          style={{ width: 90, padding: "0.3rem" }}
        />
      </td>
      <td style={{ textAlign: "right" }}>{subtotal.toFixed(2)}</td>
      <td>
        <button
          type="button"
          onClick={() => onEliminar(index)}
          aria-label={`Eliminar pieza ${index + 1}`}
        >
          ×
        </button>
      </td>
    </tr>
  );
});

// ─────────────────────────────────────────────
// Formulario de presupuesto
// ─────────────────────────────────────────────
export default function FormularioPresupuesto({ orden, onGuardado }) {
  const [diagnostico, setDiagnostico] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [piezas, setPiezas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 useMemo: total calculado, NUNCA se guarda en el servidor
  const total = useMemo(() => {
    const mano = Number(manoObra) || 0;
    const sumaPiezas = piezas.reduce(
      (acc, p) =>
        acc + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
      0
    );
    return mano + sumaPiezas;
  }, [manoObra, piezas]);

  // 🔹 useCallback: handlers pasados a PiezaRow (que está memoizado).
  // Sin useCallback, cada tecla recrearía la función y re-renderizaría TODAS las filas.
  const cambiarPieza = useCallback((index, campo, valor) => {
    setPiezas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p))
    );
  }, []);

  const eliminarPieza = useCallback((index) => {
    setPiezas((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const agregarPieza = useCallback(() => {
    setPiezas((prev) => [
      ...prev,
      { _key: crypto.randomUUID(), descripcion: "", cantidad: 1, precio: 0 },
    ]);
  }, []);

  async function guardarPresupuesto(e) {
    e.preventDefault();
    setError(null);

    if (!diagnostico.trim()) return setError("El diagnóstico es obligatorio.");
    if (manoObra === "" || Number(manoObra) < 0)
      return setError("La mano de obra debe ser un número ≥ 0.");

    // Validar filas con descripción no vacía
    const piezasLimpias = piezas
      .filter((p) => p.descripcion.trim() !== "")
      .map(({ _key, ...rest }) => ({
        descripcion: rest.descripcion.trim(),
        cantidad: Number(rest.cantidad) || 0,
        precio: Number(rest.precio) || 0,
      }));

    setEnviando(true);
    try {
      // ⚠️ Enviamos estado + presupuesto en UNA sola petición:
      // el hook del servidor valida la transición y la inmutabilidad del presupuesto.
      await actualizar("ordenes", orden.id, {
        estado: "presupuestada",
        diagnostico: diagnostico.trim(),
        manoObra: Number(manoObra),
        piezas: piezasLimpias,
      });
      onGuardado?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={guardarPresupuesto}
      style={{ display: "grid", gap: "1rem", border: "1px solid #ccc", padding: "1rem", borderRadius: 6 }}
    >
      <h2 style={{ margin: 0 }}>Presupuesto</h2>

      <label>
        Diagnóstico
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          rows={3}
          style={{ display: "block", width: "100%", padding: "0.4rem" }}
          placeholder="Qué se encontró al revisar el equipo…"
        />
      </label>

      <label>
        Mano de obra (USD)
        <input
          type="number"
          min="0"
          step="0.01"
          value={manoObra}
          onChange={(e) => setManoObra(e.target.value)}
          style={{ display: "block", width: 140, padding: "0.4rem" }}
        />
      </label>

      <fieldset style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
        <legend>Piezas</legend>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 13, color: "#555" }}>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th style={{ textAlign: "right" }}>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p, i) => (
              <PiezaRow
                key={p._key}
                index={i}
                pieza={p}
                onCambiar={cambiarPieza}
                onEliminar={eliminarPieza}
              />
            ))}
          </tbody>
        </table>

        <button type="button" onClick={agregarPieza} style={{ marginTop: "0.5rem" }}>
          + Añadir pieza
        </button>
      </fieldset>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid #333",
          paddingTop: "0.5rem",
        }}
      >
        <strong>Total (calculado, no se guarda):</strong>
        <strong style={{ fontSize: "1.2rem" }}>{total.toFixed(2)} USD</strong>
      </div>

      {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

      <button type="submit" disabled={enviando} style={{ padding: "0.6rem" }}>
        {enviando ? "Guardando…" : "Registrar presupuesto y pasar a presupuestada"}
      </button>
    </form>
  );
}