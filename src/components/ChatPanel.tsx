import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import styles from "./ChatPanel.module.css";

interface ChatPanelProps {
  socket: Socket;
  roomName: string;
}

export default function ChatPanel({ socket, roomName }: ChatPanelProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Listen for chat events
  useEffect(() => {
    if (!socket) return;

    socket.on("chatHistory", (history: string[]) => {
      setMessages(history);
    });

    socket.on("chatMessage", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chatHistory");
      socket.off("chatMessage");
    };
  }, [socket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, input.trim()]);

    socket.emit("chatMessage", {
      roomName,
      message: input.trim(),
    });

    setInput("");
  };

  return (
    <div className={styles.ChatPanel}>
      <h3 className={styles.header}>Chat</h3>

      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <div key={idx} className={styles.message}>
            {msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}