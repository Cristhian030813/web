/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ─────────────────────────────────────────────
  // 2 clientes
  // ─────────────────────────────────────────────
  const clientes = app.findCollectionByNameOrId("clientes");

  const c1 = new Record(clientes);
  c1.set("nombre", "Ana García");
  c1.set("telefono", "555-1001");
  app.save(c1);

  const c2 = new Record(clientes);
  c2.set("nombre", "Luis Martínez");
  c2.set("telefono", "555-1002");
  app.save(c2);

  const ordenes = app.findCollectionByNameOrId("ordenes");
  const eventos = app.findCollectionByNameOrId("eventos");

  // ─────────────────────────────────────────────
  // Orden 1: solicitada (sin historial)
  // ─────────────────────────────────────────────
  const o1 = new Record(ordenes);
  o1.set("cliente", c1.id);
  o1.set("equipo", "iPhone 12");
  o1.set("problema", "No enciende después de una caída.");
  o1.set("estado", "solicitada");
  app.save(o1);

  // ─────────────────────────────────────────────
  // Orden 2: en_diagnostico (1 evento)
  // ─────────────────────────────────────────────
  const o2 = new Record(ordenes);
  o2.set("cliente", c2.id);
  o2.set("equipo", "Dell Inspiron 15");
  o2.set("problema", "La pantalla parpadea al mover la tapa.");
  o2.set("estado", "en_diagnostico");
  app.save(o2);

  const e1 = new Record(eventos);
  e1.set("orden", o2.id);
  e1.set("de", "solicitada");
  e1.set("a", "en_diagnostico");
  app.save(e1);

  // ─────────────────────────────────────────────
  // Orden 3: presupuestada (2 eventos + presupuesto)
  // ─────────────────────────────────────────────
  const o3 = new Record(ordenes);
  o3.set("cliente", c1.id);
  o3.set("equipo", 'Samsung TV 55"');
  o3.set("problema", "Enciende pero no hay imagen, sí hay sonido.");
  o3.set("estado", "presupuestada");
  o3.set("diagnostico", "Fuente de alimentación dañada.");
  o3.set("manoObra", 40);
  o3.set(
    "piezas",
    JSON.stringify([
      { descripcion: "Fuente de alimentación", cantidad: 1, precio: 85 },
      { descripcion: "Cable interno", cantidad: 2, precio: 5 },
    ])
  );
  app.save(o3);

  const e2 = new Record(eventos);
  e2.set("orden", o3.id);
  e2.set("de", "solicitada");
  e2.set("a", "en_diagnostico");
  app.save(e2);

  const e3 = new Record(eventos);
  e3.set("orden", o3.id);
  e3.set("de", "en_diagnostico");
  e3.set("a", "presupuestada");
  app.save(e3);
}, (app) => {
  // rollback: borrar solo lo que esta migración creó
  try {
    const todosOrdenes = app.findRecordsByFilter("ordenes", "", "", 1000, 0);
    for (const o of todosOrdenes) app.delete(o);
    const todosClientes = app.findRecordsByFilter("clientes", "", "", 1000, 0);
    for (const c of todosClientes) app.delete(c);
  } catch (_) {
    // ignorar si ya no existen
  }
});