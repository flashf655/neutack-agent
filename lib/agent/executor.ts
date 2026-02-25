import { generateContent } from '../vertex';
import { AgentMode, SYSTEM_PROMPTS, TASK_EXTRACTION_PROMPT, SUMMARIZE_LONG_INPUT_PROMPT } from './prompts';
import { addMessage, getRecentMessages, addTask, logAction } from '../db';

export async function processAgentRequest(userMessage: string, mode: AgentMode = 'general') {
    try {
        await logAction('request_start', userMessage.length);

        const history = await getRecentMessages(6); // Gets last 6 messages

        let promptContent = userMessage;

        // Summarization feature (for large inputs)
        if (userMessage.length > 5000) {
            const sumResp = await generateContent(`${SUMMARIZE_LONG_INPUT_PROMPT}\n\n${userMessage}`);
            const summary = sumResp.candidates?.[0]?.content?.parts?.[0]?.text || userMessage;
            promptContent = `[The user provided a very long input. Here is a summary of it for your context:]\n${summary}\n\n[Original message truncated for processing...]`;
        }

        const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Agent'}: ${h.content}`).join('\n\n');

        const finalPrompt = `
# Conversation History:
${historyText || 'No previous context.'}

# Current User Message:
${promptContent}
`;

        const systemInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS['general'];
        const aiResponse = await generateContent(finalPrompt, systemInstruction);
        const agentText = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to process that request.";

        // Save encrypted memory
        await addMessage('user', userMessage);
        await addMessage('agent', agentText);

        // Async Background Extraction of Tasks
        extractAndSaveTasks(userMessage, agentText).catch(console.error);

        return { response: agentText };
    } catch (error) {
        console.error("Executor Error:", error);
        throw error;
    }
}

async function extractAndSaveTasks(userMessage: string, agentResponse: string) {
    const prompt = `${TASK_EXTRACTION_PROMPT}

# User Message: 
${userMessage}

# Agent Response: 
${agentResponse}
`;

    try {
        const extResponse = await generateContent(prompt);
        let text = extResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

        // Sometimes LLMs wrap in ```json ... ``` despite instructions. Strip it.
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const tasks = JSON.parse(text);
        if (Array.isArray(tasks)) {
            for (const t of tasks) {
                if (t.title) {
                    await addTask(t.title, t.priority || 'normal');
                }
            }
        }
    } catch (e) {
        // Failed to parse or extract, ignore to maintain fast UX
    }
}
