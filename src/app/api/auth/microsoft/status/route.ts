'use server';

import { getMicrosoftTokensFromFirestore } from '@/services/microsoftGraphService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ isConnected: false }, { status: 400 });
        }
        const tokens = await getMicrosoftTokensFromFirestore(userId);
        
        return NextResponse.json({ isConnected: !!tokens });
    } catch (error) {
        console.error("Error checking Microsoft connection status:", error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
