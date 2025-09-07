
import { getTokensFromCode, saveNotionToken } from '@/services/notionService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        console.error('Notion Auth Error:', error);
        return new NextResponse(`Authentication failed: ${error}. This window will close automatically.`, { status: 400 });
    }
    
    if (!code) {
        return new NextResponse('No authorization code received from Notion. This window will close automatically.', { status: 400 });
    }
    
    if (!state) {
        return new NextResponse('No state parameter received. Cannot verify request origin.', { status: 400 });
    }

    try {
        const { userId } = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii'));
        if (!userId) throw new Error('User ID not found in state.');

        const response = await getTokensFromCode(code);
        await saveNotionToken(userId, response.access_token);
        
        const htmlResponse = `
          <!DOCTYPE html><html><head><title>Authentication Successful</title></head><body>
            <h1>Success!</h1><p>Your Notion account has been connected.</p>
            <script>
              if (window.opener) { window.opener.postMessage('auth-success-notion', '*'); }
              setTimeout(() => window.close(), 500);
            </script>
          </body></html>`;

        return new NextResponse(htmlResponse, { status: 200, headers: { 'Content-Type': 'text/html' } });
    } catch (err: any) {
        console.error("Failed to exchange code for Notion tokens:", err.message);
        return new NextResponse(`Error: ${err.message}. Please try again.`, { status: 500 });
    }
}
