import { useCallback, useEffect, useState } from "react";
import { obtener, listarEventos } from "../api/pocketbase.js";

export function useOrden(id) {
  const [orden, setOrden] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [refrescar, setRefrescar] = useState(0);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [o, evs] = await Promise.all([
          obtener("ordenes", id, { expand: "cliente", signal: controller.signal }),
          listarEventos(id),
        ]);
        setOrden(o);
        setEventos(evs);
      } catch (e) {
        // Ignoramos el error si fue por cancelación
        if (e.name === "AbortError") return;
        setError(e.message);
      } finally {
        // Solo marcamos "cargando=false" si no fue abortado
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    cargar();

    // 🧹 LIMPIEZA REAL: cancela el fetch si cambia id o se desmonta
    return () => controller.abort();
  }, [id, refrescar]);

  const recargar = useCallback(() => setRefrescar((x) => x + 1), []);

  return { orden, eventos, cargando, error, recargar };
}