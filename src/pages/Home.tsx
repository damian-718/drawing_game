import { useState } from "react";
import { useNavigate } from "react-router-dom";

// export default function is what allows this to be a component that can be rendered anywhere via < Home/>
export default function Home() {
    // navigate is used within a function like onclick where it dynamically changes the url
  const navigate = useNavigate();

  const [name, setName] = useState(""); 

  const handleCreateName = () => {
    if (!name.trim()) {
      alert("Please enter a name before creating a room.");
      return;
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>DrawGuessr</h1>
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateName()}
          style={styles.input}
        />
        <button onClick={handleCreateName} style={styles.createButton}>
          Create Name
        </button>
      </div>
      <button
        style={styles.button}
        onClick={() => navigate("/play")}
      >
        Play
      </button>

      <button
        style={styles.secondaryButton}
        onClick={() => navigate("/instructions")}
      >
        Instructions
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "24px",
  },
  button: {
    fontSize: "1.25rem",
    padding: "12px 32px",
    cursor: "pointer",
  },
  secondaryButton: {
    fontSize: "1rem",
    padding: "10px 28px",
    cursor: "pointer",
  },
};