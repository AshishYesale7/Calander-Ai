
import { getNotionAuthUrl } from '@/services/notionService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const url = await getNotionAuthUrl(state);
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Notion Auth URL:", error.message);
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
        const redirectUrl = new URL(baseUrl);
        redirectUrl.pathname = '/settings'; // Redirect to settings page on error
        redirectUrl.searchParams.set('notion_auth_error', 'setup_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
