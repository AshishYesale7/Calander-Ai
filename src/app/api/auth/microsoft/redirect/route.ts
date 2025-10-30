'use server';

import { getMicrosoftAuthUrl } from '@/services/microsoftGraphService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const url = await getMicrosoftAuthUrl(request, state);
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Microsoft Auth URL:", error.message);
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
        const redirectUrl = new URL(baseUrl);
        redirectUrl.pathname = '/settings';
        redirectUrl.searchParams.set('microsoft_auth_error', 'setup_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
