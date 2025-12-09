import { useUser } from "@clerk/chrome-extension";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // resolve backend URL  
  const API_BASE = `${process.env.BACKEND_URL}${process.env.DASHBOARD_ENDPOINT}`;

  useEffect(() => {
    if (!isLoaded || !user) return;

    console.debug("[GG] Fetching dashboard history for:", user.id);

    fetch(`${API_BASE}/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        console.debug("[GG] History received:", data);
        setHistory(data);
      })
      .catch((err) => console.error("[GG] Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return <div style={{ padding: "20px", color: "white" }}>Loading Dashboard…</div>;
  }

  return (
    <div style={{ padding: "16px", color: "white" }}>
      <h2>Risk Detection Dashboard</h2>

      {history.length === 0 ? (
        <p style={{ marginTop: "10px", opacity: 0.7 }}>
          No phishing detections recorded yet.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: "8px", textAlign: "left" }}>Time</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Snippet</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, i) => {
              let parsed = {};
              try {
                parsed = JSON.parse(item.response);
              } catch (err) {
                console.warn("[GG] Failed to parse response", item.response);
              }

              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <td style={{ padding: "6px" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "6px" }} title={`${item.request}`}>
                    {item.request?.slice(0, 50)}…
                  </td>
                  <td style={{ padding: "6px" }}>{parsed.risk || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
