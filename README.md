# Taller de Reparaciones — React + PocketBase

Aplicación web para gestionar las órdenes de un taller de reparación de equipos electrónicos. Reemplaza la libreta: cada equipo pasa por un flujo de etapas controlado, con presupuesto, historial de eventos y fotos.

- **Frontend:** React + Vite + React Router (`fetch` puro, sin SDK)
- **Backend:** PocketBase (migraciones y hooks versionados)
- **Sin autenticación:** solo lo usa el personal del taller

---

## Requisitos previos

- **Node.js** ≥ 18 y `npm`
- **PocketBase** ≥ 0.23 — descarga el binario según tu SO desde https://pocketbase.io/docs/

Coloca el binario en `pocketbase/pocketbase` (o `pocketbase/pocketbase.exe` en Windows).

---

## Estructura del repositorio

```
taller/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── api/pocketbase.js    # Cliente fetch
│   │   ├── components/          # Layout, NavBar, OrdenCard, ...
│   │   ├── hooks/               # useOrden, useOrdenes, useClientes
│   │   ├── pages/               # ListaOrdenes, DetalleOrden, NuevaOrden, 404
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js           # Proxy /api → 127.0.0.1:8090
│   └── package.json
├── pocketbase/
│   ├── pb_migrations/           # Esquema + seed (versionados)
│   ├── pb_hooks/                # Validación de transiciones + historial
│   └── pocketbase               # Binario (NO versionado)
└── README.md
```

---

## Cómo levantar el proyecto desde cero

### 1) Backend (PocketBase)

```bash
cd pocketbase
./pocketbase serve         # Windows: pocketbase.exe serve
```

- La primera vez **crea la base de datos** en `pb_data/` y **aplica todas las migraciones** automáticamente.
- Admin UI: http://127.0.0.1:8090/_/ (crea tu usuario admin la primera vez)
- API: http://127.0.0.1:8090/api/

> Al arrancar por primera vez, la migración de **seed** ya deja 2 clientes y 3 órdenes de ejemplo (ver más abajo).

### 2) Frontend (React + Vite)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173/
- Vite hace proxy de `/api` → `127.0.0.1:8090`, así no hay CORS.

---

## Datos de prueba (seed)

La migración `pb_migrations/1999999999_seed_demo.js` crea automáticamente:

**Clientes**
| Nombre | Teléfono |
|--------|----------|
| Ana García | 555-1001 |
| Luis Martínez | 555-1002 |

**Órdenes**
| Equipo | Estado | Historial |
|--------|--------|-----------|
| iPhone 12 | `solicitada` | — |
| Dell Inspiron 15 | `en_diagnostico` | solicitada → en_diagnostico |
| Samsung TV 55" | `presupuestada` | solicitada → en_diagnostico → presupuestada |

La orden `presupuestada` ya tiene diagnóstico, mano de obra y piezas cargadas para que puedas probar el flujo de aprobar/rechazar sin escribir nada.

---

## Reglas del taller implementadas

### Flujo de estados

```
solicitada ─┬─► en_diagnostico ─► presupuestada ─┬─► aprobada ─► en_reparacion ─► lista ─► entregada
            │                                     └─► rechazada (final)
            └─► cancelada (final)
```

- Solo se permiten las transiciones de la tabla anterior.
- Los estados `rechazada`, `cancelada` y `entregada` son finales.
- El presupuesto se fija al pasar a `presupuestada` y no se puede modificar.
- El total **no se guarda**: se calcula en el cliente con `useMemo` (mano de obra + Σ cantidad × precio).

### Garantías (aunque se llame la API directamente)

| Garantía | Cómo se cumple |
|----------|----------------|
| **Orden del proceso** | Hook `onRecordBeforeUpdateRequest` en `ordenes` valida la tabla de transiciones |
| **Historial inmutable** | Hook `onRecordAfterUpdateRequest` crea el `evento`; hooks `BeforeUpdate/Delete` sobre `eventos` los bloquean |
| **Presupuesto inmutable** | El hook bloquea cambios a `diagnostico`, `manoObra`, `piezas` cuando la orden está `presupuestada` o posterior |
| **No borrar órdenes** | API rule + hook `onRecordBeforeDeleteRequest` |
| **Coherencia** | Todo vive en PocketBase; la UI releé tras cada acción |

---

## Pruebas de garantía (opcional pero recomendado)

Con PocketBase corriendo, desde otra terminal:

```bash
PB=http://127.0.0.1:8090/api/collections

# 1) Saltarse etapas → debe fallar (400)
curl -X PATCH $PB/ordenes/records/ID_ORDEN \
  -H "Content-Type: application/json" \
  -d '{"estado":"entregada"}'

# 2) Modificar presupuesto cerrado → debe fallar (400)
curl -X PATCH $PB/ordenes/records/ID_PRESUPUESTADA \
  -H "Content-Type: application/json" \
  -d '{"manoObra":1}'

# 3) Cambiar estado final → debe fallar (400)
curl -X PATCH $PB/ordenes/records/ID_RECHAZADA \
  -H "Content-Type: application/json" \
  -d '{"estado":"aprobada"}'

# 4) Borrar orden → debe fallar (403/404)
curl -X DELETE $PB/ordenes/records/ID_ORDEN

# 5) Editar evento → debe fallar (403/400)
curl -X PATCH $PB/eventos/records/ID_EVENTO \
  -H "Content-Type: application/json" \
  -d '{"a":"entregada"}'

# 6) Borrar evento → debe fallar (403/400)
curl -X DELETE $PB/eventos/records/ID_EVENTO
```

**Todas deben devolver error.** Si alguna devuelve `200 OK`, hay un fallo en `pb_hooks/main.pb.js` o en las API rules.

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite, JavaScript |
| Router | `react-router-dom` (rutas anidadas con `Outlet`) |
| Fetch | `fetch` nativo (sin SDK de PocketBase ni librerías de estado) |
| Backend | PocketBase (migraciones + hooks JS) |
| DB | SQLite interna de PocketBase |