
'use server';

import { isNotionConnected } from '@/services/notionService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ isConnected: false }, { status: 400 });
        }
        const connected = await isNotionConnected(userId);
        return NextResponse.json({ isConnected: connected });
    } catch (error) {
        console.error("Error checking Notion connection status:", error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
