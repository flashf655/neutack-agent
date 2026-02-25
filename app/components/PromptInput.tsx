"use client";

import { useState } from "react";
import styles from "./PromptInput.module.css";

interface PromptProps {
    onSend: (message: string, mode: string) => void;
    isLoading: boolean;
}

export default function PromptInput({ onSend, isLoading }: PromptProps) {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("general");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input, mode);
            setInput("");
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.modeWrapper}>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className={styles.modeSelect}
                        disabled={isLoading}
                        aria-label="Agent Mode"
                    >
                        <option value="general">🌍 General</option>
                        <option value="planner">📋 Planner</option>
                        <option value="research">🔍 Research</option>
                        <option value="creative">💡 Creative</option>
                    </select>
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What can I help you with today?"
                    className={styles.input}
                    disabled={isLoading}
                    autoFocus
                />

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <span className={styles.spinner} />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                </button>
            </form>
            <div className={styles.hint}>
                Press Enter to send. NeuTack Agents can make mistakes, verify important information.
            </div>
        </div>
    );
}
