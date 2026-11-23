// pb_hooks/lib/transiciones.js
module.exports = {
  // Transiciones permitidas: de -> [a, ...]
  TRANSICIONES: {
    solicitada:      ["en_diagnostico", "cancelada"],
    en_diagnostico:  ["presupuestada"],
    presupuestada:   ["aprobada", "rechazada"],
    aprobada:        ["en_reparacion"],
    en_reparacion:   ["lista"],
    lista:           ["entregada"],
    // estados finales: sin salida
    rechazada:       [],
    cancelada:       [],
    entregada:       [],
  },

  ESTADOS_FINALES: ["rechazada", "cancelada", "entregada"],

  // Campos que NO se pueden tocar una vez que la orden ya fue presupuestada
  CAMPOS_BLOQUEADOS_POST_PRESUPUESTO: ["diagnostico", "manoObra", "piezas"],

  // Estados en los que el presupuesto ya está fijado
  ESTADOS_PRESUPUESTO_CERRADO: [
    "presupuestada", "aprobada", "rechazada",
    "en_reparacion", "lista", "entregada",
  ],
};