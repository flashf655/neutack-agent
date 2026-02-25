"use client";

import { useEffect, useRef } from "react";
import styles from "./ResponsePanel.module.css";

export interface Message {
    role: "user" | "agent";
    content: string;
}

interface ResponseProps {
    messages: Message[];
    isLoading: boolean;
}

export default function ResponsePanel({ messages, isLoading }: ResponseProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (panelRef.current) {
            panelRef.current.scrollTop = panelRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    if (messages.length === 0 && !isLoading) {
        return (
            <div className={styles.emptyState}>
                <h2>Hi there.</h2>
                <p>I'm your NeuTack Agent. How can I help you today?</p>
            </div>
        );
    }

    return (
        <div className={styles.panel} ref={panelRef}>
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`${styles.messageWrapper} ${msg.role === "user" ? styles.userRow : styles.agentRow
                        }`}
                >
                    <div
                        className={`${styles.messageBubble} ${msg.role === "user" ? styles.userBubble : styles.agentBubble
                            } animate-fade-in`}
                    >
                        {msg.role === "agent" && (
                            <div className={styles.avatar}>✨</div>
                        )}
                        <div className={styles.content}>
                            {msg.content.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    <br />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.agentRow}`}>
                    <div className={`${styles.messageBubble} ${styles.agentBubble} animate-fade-in`}>
                        <div className={styles.avatar}>✨</div>
                        <div className={styles.typingIndicator}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
