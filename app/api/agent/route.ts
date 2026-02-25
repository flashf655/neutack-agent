import { NextResponse } from 'next/server';
import { processAgentRequest } from '../../../lib/agent/executor';

export async function POST(req: Request) {
    try {
        const { message, mode } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const result = await processAgentRequest(message, mode);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Agent API Route Error:', error);
        return NextResponse.json({ error: 'Failed to process agent request.' }, { status: 500 });
    }
}
