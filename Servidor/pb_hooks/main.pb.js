// pb_hooks/main.pb.js
const {
  TRANSICIONES,
  ESTADOS_FINALES,
  CAMPOS_BLOQUEADOS_POST_PRESUPUESTO,
  ESTADOS_PRESUPUESTO_CERRADO,
} = require(`${__hooks}/lib/transiciones.js`);

// ─────────────────────────────────────────────
// 1) VALIDACIÓN antes de actualizar una orden
// ─────────────────────────────────────────────
onRecordBeforeUpdateRequest((e) => {
  if (e.collection.name !== "ordenes") return;

  const original = e.record.original();
  const estadoAntes = original.get("estado");
  const estadoDespues = e.record.get("estado");

  // ── A) Si es estado final, no se permite ningún cambio ──
  if (ESTADOS_FINALES.includes(estadoAntes)) {
    throw new BadRequestError(
      `La orden está en estado final "${estadoAntes}" y no puede modificarse.`
    );
  }

  // ── B) Validar transición de estado ──
  if (estadoAntes !== estadoDespues) {
    const permitidos = TRANSICIONES[estadoAntes] || [];
    if (!permitidos.includes(estadoDespues)) {
      throw new BadRequestError(
        `Transición no permitida: "${estadoAntes}" → "${estadoDespues}".`
      );
    }
  }

  // ── C) Si el presupuesto ya está cerrado, bloquear campos ──
  if (ESTADOS_PRESUPUESTO_CERRADO.includes(estadoAntes)) {
    for (const campo of CAMPOS_BLOQUEADOS_POST_PRESUPUESTO) {
      const antes = JSON.stringify(original.get(campo) ?? null);
      const despues = JSON.stringify(e.record.get(campo) ?? null);
      if (antes !== despues) {
        throw new BadRequestError(
          `El campo "${campo}" no puede modificarse una vez presupuestada la orden.`
        );
      }
    }
  }

  // ── D) Al pasar de en_diagnostico → presupuestada, exigir datos ──
  if (estadoAntes === "en_diagnostico" && estadoDespues === "presupuestada") {
    const diagnostico = (e.record.get("diagnostico") || "").trim();
    const manoObra = e.record.get("manoObra");
    if (!diagnostico) {
      throw new BadRequestError("Falta el diagnóstico para presupuestar.");
    }
    if (manoObra === null || manoObra === undefined || manoObra < 0) {
      throw new BadRequestError("Falta la mano de obra para presupuestar.");
    }
  }
}, "ordenes");

// ─────────────────────────────────────────────
// 2) REGISTRAR el evento después de actualizar
// ─────────────────────────────────────────────
onRecordAfterUpdateRequest((e) => {
  if (e.collection.name !== "ordenes") return;

  const original = e.record.original();
  const estadoAntes = original.get("estado");
  const estadoDespues = e.record.get("estado");

  // Solo si cambió el estado
  if (estadoAntes === estadoDespues) return;

  const eventos = $app.findCollectionByNameOrId("eventos");
  const evento = new Record(eventos);
  evento.set("orden", e.record.id);
  evento.set("de", estadoAntes);
  evento.set("a", estadoDespues);

  $app.save(evento);
}, "ordenes");

// Bloqueo de eventos
 onRecordBeforeUpdateRequest((e) => {
  if (e.collection.name === "eventos") {
    throw new BadRequestError("Los eventos son inmutables.");
  }
}, "eventos");

onRecordBeforeDeleteRequest((e) => {
  if (e.collection.name === "eventos") {
    throw new BadRequestError("Los eventos no se pueden eliminar.");
  }
}, "eventos");

onRecordBeforeDeleteRequest((e) => {
  if (e.collection.name === "ordenes") {
    throw new BadRequestError("Las órdenes no se pueden eliminar.");
  }
}, "ordenes");