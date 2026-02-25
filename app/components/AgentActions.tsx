"use client";

import { useState } from "react";
import styles from "./AgentActions.module.css";

const DEFAULTS = [
    { icon: "📝", label: "Draft Email", prompt: "Help me draft a professional email about..." },
    { icon: "📅", label: "Schedule Meeting", prompt: "Schedule a 30 min meeting with..." },
    { icon: "📊", label: "Summarize Notes", prompt: "Summarize the following notes into bullet points:\n\n" },
    { icon: "💡", label: "Brainstorm Ideas", prompt: "Give me 5 creative ideas for..." },
];

interface ActionsProps {
    onActionSelect: (prompt: string) => void;
}

export default function AgentActions({ onActionSelect }: ActionsProps) {
    return (
        <aside className={styles.actionsPanel}>
            <h3 className={styles.header}>Suggested Actions</h3>
            <div className={styles.grid}>
                {DEFAULTS.map((action, idx) => (
                    <button
                        key={idx}
                        className={styles.actionBtn}
                        onClick={() => onActionSelect(action.prompt)}
                    >
                        <span className={styles.icon}>{action.icon}</span>
                        <span className={styles.label}>{action.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.statusSection}>
                <h4 className={styles.statusHeader}>System Status</h4>
                <div className={styles.statusItem}>
                    <span className={styles.statusDot}></span>
                    Agent Online
                </div>
            </div>
        </aside>
    );
}
