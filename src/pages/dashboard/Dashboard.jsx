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
    return (
      <div style={{ padding: "20px", fontSize: "18px", color: "#333" }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "#f7f7f7",
        minHeight: "100vh",
        color: "#222",
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "10px",
          fontWeight: "600"
        }}
      >
        Hello {user?.firstName || user?.username || "User"} 👋
      </h1>

      <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
        Risk Detection Dashboard
      </h2>

      {history.length === 0 ? (
        <p style={{ opacity: 0.65 }}>No detected history yet.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #ddd",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
          }}
        >
          <table
            style={{
              width: "100%",
              fontSize: "14px",
              borderCollapse: "collapse"
            }}
          >
            <thead style={{ background: "#dcefe8" }}>
              <tr>
                <th style={th}>Time</th>
                <th style={th}>URL</th>
                <th style={th}>Request</th>
                <th style={th}>Response</th>
                <th style={th}>Risk</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item, i) => {
                let parsed = {};
                try {
                  parsed = JSON.parse(item.response);
                } catch {}

                return (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? "#fafafa" : "#ffffff",
                      borderBottom: "1px solid #eee"
                    }}
                  >
                    <td style={td}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    <td
                      style={{ ...td, color: "#0a68b4" }}
                      title={item.requestUrl}
                    >
                      {item.requestUrl?.slice(0, 40) || "—"}…
                    </td>

                    <td style={td} title={item.request}>
                      {item.request?.slice(0, 40)}…
                    </td>

                    <td
                      style={td}
                      title={parsed.msg || parsed.message || ""}
                    >
                      {(parsed.msg || parsed.message || "").slice(0, 40)}…
                    </td>

                    <td
                      style={{
                        ...td,
                        fontWeight: 600,
                        color:
                          parsed.risk === "phishing"
                            ? "#b71c1c"
                            : parsed.risk === "benign"
                            ? "#2e7d32"
                            : "#f57c00"
                      }}
                    >
                      {parsed.risk || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: "10px 8px",
  textAlign: "left",
  fontWeight: "600",
  borderBottom: "2px solid #cfd8d5"
};

const td = {
  padding: "8px",
  fontSize: "13px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "250px"
};
