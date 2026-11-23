// ─────────────────────────────────────────────────────────────
// Cliente mínimo de API para PocketBase usando fetch (sin SDK)
// ─────────────────────────────────────────────────────────────
const BASE = ""; // gracias al proxy de Vite, usamos rutas relativas

// ─────────────────────────────────────────────
// Listar registros de una colección
// ─────────────────────────────────────────────
export async function listar(
  coleccion,
  { filter = "", sort = "-created", expand = "", signal } = {}
) {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (sort) params.set("sort", sort);
  if (expand) params.set("expand", expand);
  params.set("perPage", "200");

  const res = await fetch(`${BASE}/api/collections/${coleccion}/records?${params}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Error ${res.status} al listar ${coleccion}`);
  return res.json();
}

// ─────────────────────────────────────────────
// Obtener un registro por id
// ─────────────────────────────────────────────
export async function obtener(coleccion, id, { expand = "", signal } = {}) {
  const params = new URLSearchParams();
  if (expand) params.set("expand", expand);
  const res = await fetch(
    `${BASE}/api/collections/${coleccion}/records/${id}?${params}`,
    { signal }
  );
  if (!res.ok) throw new Error(`Error ${res.status} al obtener ${coleccion}/${id}`);
  return res.json();
}

// ─────────────────────────────────────────────
// Crear registro (JSON, sin archivos)
// ─────────────────────────────────────────────
export async function crear(coleccion, data) {
  const res = await fetch(`${BASE}/api/collections/${coleccion}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status} al crear en ${coleccion}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Actualizar registro (JSON, sin archivos)
// ─────────────────────────────────────────────
export async function actualizar(coleccion, id, data) {
  const res = await fetch(`${BASE}/api/collections/${coleccion}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status} al actualizar ${coleccion}/${id}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Crear registro CON archivos (FormData)
// ─────────────────────────────────────────────
export async function crearConArchivos(coleccion, campos, archivos = {}) {
  const fd = new FormData();

  for (const [clave, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === null) continue;
    if (Array.isArray(valor) || typeof valor === "object") {
      fd.append(clave, JSON.stringify(valor));
    } else {
      fd.append(clave, String(valor));
    }
  }

  // archivos: { fotos: File[] , otroCampo: File[] }
  for (const [campo, lista] of Object.entries(archivos)) {
    for (const file of lista) {
      fd.append(campo, file);
    }
  }

  const res = await fetch(`${BASE}/api/collections/${coleccion}/records`, {
    method: "POST",
    body: fd, // ⚠️ NO pongas Content-Type: el navegador añade el boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status} al crear en ${coleccion}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Helpers específicos del proyecto
// ─────────────────────────────────────────────

// Lista completa de clientes (ordenada por nombre)
export async function listarClientes() {
  const data = await listar("clientes", { sort: "nombre" });
  return data.items;
}

// Historial de eventos de una orden (del más antiguo al más reciente)
export async function listarEventos(ordenId) {
  const data = await listar("eventos", {
    filter: `orden="${ordenId}"`,
    sort: "created", // ascendente: línea de tiempo
  });
  return data.items;
}

// Construye la URL pública de un archivo de un registro
export function urlArchivo(record, nombreArchivo) {
  if (!nombreArchivo) return "";
  return `/api/files/${record.collectionId}/${record.id}/${nombreArchivo}`;
}