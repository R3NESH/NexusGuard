import React, { useEffect, useState } from "react";

const lightTheme = {
  bg: "#f3f4f6",
  text: "#0f172a",
  panel: "#ffffff",
  muted: "#6b7280",
  accentBlue: "#2563eb",
  accentRed: "#dc2626",
  accentRedBg: "#fef2f2",
  accentGreen: "#10b981",
  accentYellow: "#f59e0b",
};
const darkTheme = {
  bg: "#0b1220",
  text: "#e5e7eb",
  panel: "#111827",
  muted: "#9ca3af",
  accentBlue: "#60a5fa",
  accentRed: "#f87171",
  accentRedBg: "#1f2937",
  accentGreen: "#34d399",
  accentYellow: "#fcd34d",
};

const AdminDashboard = () => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generatedPhishing, setGeneratedPhishing] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const theme = darkMode ? darkTheme : lightTheme;

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchData = () => {
      fetch(`${BACKEND_URL}/api/students-data`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStudentData(data);
          } else {
            setStudentData([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching student data:", error);
          setStudentData([]);
          setLoading(false);
        });
    };
    const fetchLeaderboard = () => {
      fetch(`${BACKEND_URL}/api/leaderboard?limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setLeaderboard(data);
        })
        .catch((e) => console.error("Error fetching leaderboard:", e));
    };
    fetchData();
    fetchLeaderboard();
    const intervalId = setInterval(() => {
      fetchData();
      fetchLeaderboard();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [BACKEND_URL]);

  const handleGenerate = async () => {
    setGenLoading(true);
    setGeneratedPhishing(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-phishing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate phishing text.");
      }

      setGeneratedPhishing(data);
    } catch (error) {
      console.error("Error generating phishing attack:", error);
      setGeneratedPhishing({ error: error.message });
    } finally {
      setGenLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to permanently clear ALL student entry data? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/clear-students-data`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setStudentData([]); 
      } else {
        alert(`Failed to clear data: ${data.error || 'Server error'}`);
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Network error. Failed to clear data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (studentData.length === 0) {
      alert("No data to export.");
      return;
    }
    
    try {
      window.location.href = `${BACKEND_URL}/api/export-students-data`;
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to initiate CSV download.");
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "N/A";
    return new Date(ts).toLocaleString();
  };


  const tableHeaderStyle = {
    padding: "1rem 1.5rem", 
    textAlign: "left",
    fontSize: "0.85rem", 
    fontWeight: "bold",
    textTransform: "uppercase",
    color: theme.muted,
    borderBottom: `1px solid ${theme.muted}`,
    backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
  };

  const tableCellStyle = {
    padding: "1rem 1.5rem",
    verticalAlign: "top",
    borderBottom: darkMode ? `1px solid ${theme.panel}` : `1px solid ${theme.muted}`,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "20rem", 
          background: theme.panel,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
            Security Dashboard
          </h1>
          <nav>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>
                <a
                  href="#dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    color: theme.accentBlue,
                    background: darkMode ? "#1e3a8a" : "#dbeafe",
                    fontSize: '1.05rem', // INCREASED FONT SIZE
                  }}
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Export and Clear Buttons (Increased padding) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={handleExportCSV}
            disabled={loading || studentData.length === 0}
            style={{
              padding: "0.75rem 1rem", // INCREASED PADDING
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              background: theme.accentGreen,
              color: "#fff",
              opacity: loading || studentData.length === 0 ? 0.6 : 1,
            }}
          >
            Export to CSV
          </button>
          
          <button
            onClick={handleClearData}
            disabled={loading}
            style={{
              padding: "0.75rem 1rem", // INCREASED PADDING
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              background: theme.accentYellow,
              color: theme.text,
              opacity: loading ? 0.6 : 1,
            }}
          >
            Clear All Data
          </button>

          {/* Dark Mode Switch and User Info (Increased padding) */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            style={{
              padding: "0.75rem 1rem", // INCREASED PADDING
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              background: theme.accentBlue,
              color: "#fff",
            }}
          >
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderTop: `1px solid ${theme.muted}`,
              paddingTop: "1rem",
            }}
          >
            <img
              src="https://picsum.photos/id/1005/40"
              alt="User avatar"
              style={{ borderRadius: "50%", marginRight: "0.75rem" }}
            />
            <span style={{ fontWeight: 500 }}>Admin User</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "3rem", overflowX: "hidden" }}> {/* INCREASED PADDING */}
        <h2 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem" }}> {/* INCREASED FONT SIZE AND MARGIN */}
          Student Entries
        </h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div
            style={{
              background: theme.panel,
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Full Name</th>
                  <th style={tableHeaderStyle}>Student ID</th>
                  <th style={tableHeaderStyle}>Email & Mobile</th>
                  <th style={tableHeaderStyle}>Academics</th>
                  <th style={tableHeaderStyle}>Opportunity</th>
                  <th style={{ ...tableHeaderStyle, whiteSpace: "nowrap" }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {studentData.length > 0 ? (
                  studentData.map((entry) => (
                    <tr key={entry.id}>
                      <td style={tableCellStyle}>{entry.fullName}</td>
                      <td style={tableCellStyle}>{entry.studentID}</td>
                      <td style={tableCellStyle}>
                        <div>{entry.email}</div>
                        <div>{entry.mobile}</div>
                      </td>
                      <td style={tableCellStyle}>
                        {`${entry.college}, ${entry.course}, ${entry.year}, CGPA: ${entry.cgpa}`}
                      </td>
                      <td style={tableCellStyle}>{entry.opportunity}</td>
                      <td style={tableCellStyle}>{formatTimestamp(entry.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: theme.muted }}> {/* INCREASED PADDING */}
                      No student entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Phishing Attack Section */}
        <section
          style={{
            marginTop: "4rem", // INCREASED MARGIN
            background: theme.panel,
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            padding: "2rem", // INCREASED PADDING
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem", // INCREASED FONT SIZE
              fontWeight: 600,
              color: theme.accentRed,
              marginBottom: "1.5rem", // INCREASED MARGIN
            }}
          >
            Generate Phishing Attack
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}> {/* INCREASED GAP */}
            <input
              type="text"
              style={{
                flex: 1,
                padding: "0.75rem 1rem", // INCREASED PADDING
                borderRadius: "8px",
                border: `1px solid ${theme.muted}`,
                background: darkMode ? "#1f2937" : "#f9fafb",
                color: theme.text,
                fontSize: '1rem', // ENSURED STANDARD FONT SIZE
              }}
              placeholder="Enter scenario/prompt for phishing email"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              style={{
                padding: "0.75rem 2rem", // INCREASED PADDING
                borderRadius: "8px",
                background: theme.accentRed,
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
                border: "none",
                opacity: genLoading || !prompt ? 0.6 : 1,
              }}
              disabled={genLoading || !prompt}
            >
              {genLoading ? "Generating..." : "Generate"}
            </button>
          </div>
          {generatedPhishing && (
            <div
              style={{
                marginTop: "1.5rem", // INCREASED MARGIN
                padding: "1.5rem", // INCREASED PADDING
                borderRadius: "8px",
                background: theme.accentRedBg,
                border: `1px solid ${theme.accentRed}`,
                color: generatedPhishing.error ? theme.accentRed : theme.text,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
              }}
            >
              {generatedPhishing.error ? (
                <>
                  <b>Error:</b> {generatedPhishing.error}
                </>
              ) : (
                <>
                  <b style={{ display: "block", marginBottom: "0.75rem" }}> {/* INCREASED MARGIN */}
                    Subject: {generatedPhishing.subject}
                  </b>
                  <p>{generatedPhishing.body}</p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Leaderboard Section */}
        <section
          style={{
            marginTop: "2rem",
            background: theme.panel,
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: theme.accentBlue,
              marginBottom: "1rem",
            }}
          >
            Risk Leaderboard (Highest risk at top)
          </h3>
          {leaderboard.length === 0 ? (
            <div style={{ color: theme.muted }}>No scores yet.</div>
          ) : (
            <ol style={{ paddingLeft: "1.25rem", margin: 0 }}>
              {leaderboard.map((row) => (
                <li key={row.studentID} style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 600 }}>{row.fullName || row.studentID}</span>
                  <span style={{ color: theme.muted }}> — {row.email}</span>
                  <span style={{ float: "right", fontWeight: 700, color: row.score < 0 ? theme.accentRed : theme.accentGreen }}>
                    Score: {row.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;