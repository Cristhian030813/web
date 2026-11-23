import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { crear, crearConArchivos } from "../api/pocketbase.js";
import { useClientes } from "../hooks/useClientes.js";

const MAX_FOTOS = 3;

export default function FormularioOrden() {
  const navigate = useNavigate();
  const { clientes, cargando: cargandoClientes } = useClientes();

  // ─── Estado del formulario (controlado) ───
  const [clienteId, setClienteId] = useState("");
  const [crearClienteNuevo, setCrearClienteNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [equipo, setEquipo] = useState("");
  const [problema, setProblema] = useState("");
  const [fotos, setFotos] = useState([]);

  // ─── Estado de UI ───
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // useRef: input de archivos, para poder limpiarlo tras crear
  const inputFotosRef = useRef(null);

  // ─── Handlers ───
  function alSeleccionarFotos(e) {
    const nuevas = Array.from(e.target.files || []);
    const total = [...fotos, ...nuevas].slice(0, MAX_FOTOS);
    setFotos(total);
    // si el usuario eligió más de las permitidas, limpiamos el input
    if (fotos.length + nuevas.length > MAX_FOTOS) {
      if (inputFotosRef.current) inputFotosRef.current.value = "";
    }
  }

  function quitarFoto(index) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function alEnviar(e) {
    e.preventDefault();
    setError(null);

    // ─── Validación cliente ───
    if (!crearClienteNuevo && !clienteId) {
      return setError("Selecciona un cliente o marca 'crear cliente nuevo'.");
    }
    if (crearClienteNuevo && (!nuevoNombre.trim() || !nuevoTelefono.trim())) {
      return setError("Nombre y teléfono del nuevo cliente son obligatorios.");
    }

    // ─── Validación orden ───
    if (!equipo.trim() || !problema.trim()) {
      return setError("Equipo y problema son obligatorios.");
    }

    setEnviando(true);
    try {
      // 1) Si hay que crear cliente, primero lo creamos
      let idClienteFinal = clienteId;
      if (crearClienteNuevo) {
        const cliente = await crear("clientes", {
          nombre: nuevoNombre.trim(),
          telefono: nuevoTelefono.trim(),
        });
        idClienteFinal = cliente.id;
      }

      // 2) Creamos la orden CON las fotos en una sola petición
      const orden = await crearConArchivos(
        "ordenes",
        {
          cliente: idClienteFinal,
          equipo: equipo.trim(),
          problema: problema.trim(),
          estado: "solicitada", // forzado: el usuario no lo elige
        },
        { fotos }
      );

      // 3) Limpieza y navegación al detalle
      if (inputFotosRef.current) inputFotosRef.current.value = "";
      navigate(`/ordenes/${orden.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} style={{ display: "grid", gap: "1rem", maxWidth: 600 }}>
      <h2>Nueva orden</h2>

      {/* ─── Cliente ─── */}
      <fieldset style={{ border: "1px solid #ccc", padding: "0.75rem" }}>
        <legend>Cliente</legend>

        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <input
            type="radio"
            checked={!crearClienteNuevo}
            onChange={() => setCrearClienteNuevo(false)}
          />{" "}
          Usar cliente existente
        </label>

        {!crearClienteNuevo && (
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            disabled={cargandoClientes}
            style={{ width: "100%", padding: "0.4rem" }}
          >
            <option value="">— Selecciona un cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.telefono}
              </option>
            ))}
          </select>
        )}

        <label style={{ display: "block", margin: "0.75rem 0 0.5rem" }}>
          <input
            type="radio"
            checked={crearClienteNuevo}
            onChange={() => setCrearClienteNuevo(true)}
          />{" "}
          Crear cliente nuevo
        </label>

        {crearClienteNuevo && (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={{ padding: "0.4rem" }}
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={nuevoTelefono}
              onChange={(e) => setNuevoTelefono(e.target.value)}
              style={{ padding: "0.4rem" }}
            />
          </div>
        )}
      </fieldset>

      {/* ─── Equipo ─── */}
      <label>
        Equipo
        <input
          type="text"
          placeholder="Ej: iPhone 12, Dell Inspiron..."
          value={equipo}
          onChange={(e) => setEquipo(e.target.value)}
          style={{ display: "block", width: "100%", padding: "0.4rem" }}
        />
      </label>

      {/* ─── Problema ─── */}
      <label>
        Problema
        <textarea
          placeholder="Describe el problema que reporta el cliente..."
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          rows={4}
          style={{ display: "block", width: "100%", padding: "0.4rem" }}
        />
      </label>

      {/* ─── Fotos ─── */}
      <label>
        Fotos (máx. {MAX_FOTOS})
        <input
          ref={inputFotosRef}
          type="file"
          accept="image/*"
          multiple
          onChange={alSeleccionarFotos}
          disabled={fotos.length >= MAX_FOTOS}
          style={{ display: "block", marginTop: "0.3rem" }}
        />
      </label>

      {fotos.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {fotos.map((f, i) => (
            <li key={`${f.name}-${i}`} style={{ position: "relative" }}>
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }}
              />
              <button
                type="button"
                onClick={() => quitarFoto(i)}
                style={{ position: "absolute", top: -6, right: -6, cursor: "pointer" }}
                aria-label={`Quitar ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={enviando} style={{ padding: "0.6rem" }}>
        {enviando ? "Creando..." : "Crear orden"}
      </button>
    </form>
  );
}