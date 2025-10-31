
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/services/googleAuthService';
import type { NextRequest, NextResponse } from 'next/server';

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export async function POST(request: NextRequest) {
    try {
        const { userId, folderId = 'root' } = await request.json();
        
        if (!userId) {
            return new Response(JSON.stringify({ success: false, message: 'User ID is required.' }), { status: 400 });
        }

        const client = await getAuthenticatedClient(userId);
        if (!client) {
            return new Response(JSON.stringify({ success: false, message: 'User is not authenticated with Google.' }), { status: 401 });
        }
        
        const drive = google.drive({ version: 'v3', auth: client });
        
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            orderBy: 'folder, name',
            pageSize: 100,
        });

        const files = response.data.files?.map(file => ({
            id: file.id,
            name: file.name,
            type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
            size: file.size ? formatBytes(Number(file.size)) : undefined,
        }));
        
        return new Response(JSON.stringify({ success: true, files }), { status: 200 });

    } catch (error: any) {
        console.error("Google Drive API error:", error);
        return new Response(JSON.stringify({ success: false, message: error.message || 'Failed to fetch files from Google Drive.' }), { status: 500 });
    }
}
