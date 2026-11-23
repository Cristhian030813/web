export default function HistorialEventos({ eventos }) {
  if (eventos.length === 0) {
    return <p style={{ color: "#666" }}>Sin cambios de estado aún.</p>;
  }

  return (
    <ol style={{ paddingLeft: "1.2rem", display: "grid", gap: "0.4rem" }}>
      {eventos.map((ev) => (
        <li key={ev.id}>
          <code>{ev.de}</code> → <code>{ev.a}</code>{" "}
          <span style={{ color: "#666", fontSize: 13 }}>
            · {new Date(ev.created).toLocaleString()}
          </span>
        </li>
      ))}
    </ol>
  );
}