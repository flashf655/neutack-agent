"use client";

import { useState } from "react";
import styles from "./page.module.css";
import PromptInput from "./components/PromptInput";
import ResponsePanel, { Message } from "./components/ResponsePanel";
import AgentActions from "./components/AgentActions";

export default function PersonalAgentDashboard() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (content: string, mode: string = 'general') => {
        // Add user message to UI
        const newMessages: Message[] = [...messages, { role: "user", content }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, mode })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages([...newMessages, { role: "agent", content: data.response || "Task completed." }]);
            } else {
                console.error("Agent Error:", data);
                setMessages([...newMessages, { role: "agent", content: "Sorry, I ran into an error processing your request." }]);
            }
        } catch (error) {
            console.error("Network Error:", error);
            setMessages([...newMessages, { role: "agent", content: "Network error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionSelect = (prompt: string) => {
        // Actions defaults to general mode, but can be expanded
        handleSendMessage(prompt, 'general');
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.brand}>
                        <div className={styles.logo}></div>
                        <h1>NeuTack Agent</h1>
                    </div>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>U</div>
                        <div className={styles.privacyBadge}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Local Proxy
                        </div>
                    </div>
                </header>

                <div className={styles.workspace}>
                    <div className={styles.chatArea}>
                        <ResponsePanel messages={messages} isLoading={isLoading} />
                        <div className={styles.inputArea}>
                            <PromptInput onSend={handleSendMessage} isLoading={isLoading} />
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <AgentActions onActionSelect={handleActionSelect} />
                    </div>
                </div>
            </div>
        </div>
    );
}
