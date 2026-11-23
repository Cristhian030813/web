import { useEffect, useState } from "react";
import { listarClientes } from "../api/pocketbase.js";

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const items = await listarClientes();
        if (activo) setClientes(items);
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false; // limpieza: evita setState tras desmontaje
    };
  }, []);

  return { clientes, cargando, error };
}