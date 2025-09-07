
import { getGoogleAuthUrl } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        // Pass the entire request object to the service function
        const url = await getGoogleAuthUrl(request, state);
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error("Failed to get Google Auth URL:", error.message);
        
        // The base URL can be derived from the request in case NEXT_PUBLIC_BASE_URL is missing
        const requestUrl = new URL(request.url);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`;
        
        const redirectUrl = new URL(baseUrl);
        redirectUrl.pathname = '/settings'; // Redirect to settings page on error
        redirectUrl.searchParams.set('google_auth_error', 'setup_failed');
        return NextResponse.redirect(redirectUrl);
    }
}
