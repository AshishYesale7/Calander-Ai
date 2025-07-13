
import { getTokensFromCode, saveGoogleTokensToFirestore, getRedirectURI } from '@/services/googleAuthService';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        console.error('Google Auth Error:', error);
        
        let errorMessage = `${error}. Please try again.`;
        let errorDetails = '';

        if (error === 'redirect_uri_mismatch') {
            errorMessage = "Redirect URI Mismatch. The callback URI sent from the app does not match the one registered in your Google Cloud project.";
            try {
                // Get the URI the app tried to use for better debugging
                const attemptedUri = await getRedirectURI(request);
                errorDetails = `<p>Your app sent this URI:</p><code>${attemptedUri}</code><p>Please ensure this exact URI is listed under "Authorized redirect URIs" in your Google Cloud Console for the correct OAuth 2.0 Client ID.</p>`;
            } catch (e: any) {
                errorDetails = `<p>Could not determine the exact redirect URI used. Please check your application's base URL configuration.</p>`;
            }
        }

        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; text-align: left; }
                h1 { color: #dc3545; text-align: center; }
                p { line-height: 1.6; }
                code { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Authentication Failed</h1>
                <p>${errorMessage}</p>
                ${errorDetails}
                <p style="text-align:center; margin-top: 20px;">This window will now close.</p>
              </div>
              <script>setTimeout(() => window.close(), 12000);</script>
            </body>
          </html>
        `;
        
        return new NextResponse(htmlResponse, {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
    }
    
    if (!code) {
        const noCodeError = 'No authorization code received from Google.';
        console.error('Google Auth Error:', noCodeError);
        const htmlResponse = `
          <!DOCTYPE html><html><head><title>Authentication Failed</title></head><body><h1>Error</h1><p>${noCodeError}</p><script>setTimeout(()=>window.close(),5000)</script></body></html>
        `;
        return new NextResponse(htmlResponse, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }
    
    if (!state) {
        const noStateError = 'No state parameter received from Google. Cannot verify request origin.';
        console.error('Google Auth Error:', noStateError);
        const htmlResponse = `
          <!DOCTYPE html><html><head><title>Authentication Failed</title></head><body><h1>Error</h1><p>${noStateError}</p><script>setTimeout(()=>window.close(),5000)</script></body></html>
        `;
        return new NextResponse(htmlResponse, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    try {
        const { userId } = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii'));

        if (!userId) {
            throw new Error('User ID not found in state parameter.');
        }

        const tokens = await getTokensFromCode(request, code);
        await saveGoogleTokensToFirestore(userId, tokens);
        
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #007bff; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Success!</h1>
                <p>Your Google account has been connected successfully.</p>
                <p>This window will now close.</p>
              </div>
              <script>
                // Notify the main window to reload and then close the popup.
                if (window.opener) {
                  window.opener.postMessage('auth-success', '*');
                }
                setTimeout(() => window.close(), 500);
              </script>
            </body>
          </html>
        `;

        return new NextResponse(htmlResponse, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });

    } catch (err: any) {
        console.error("Failed to exchange code for tokens:", err.message);
        
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; color: #333; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #dc3545; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Error</h1>
                <p>Authentication failed: ${err.message || 'Unknown error'}. Please try again.</p>
                <p>This window will now close.</p>
              </div>
              <script>setTimeout(() => window.close(), 8000);</script>
            </body>
          </html>
        `;

        return new NextResponse(htmlResponse, {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
    }
}
