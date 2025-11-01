
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';

function formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function listGoogleDriveFiles(userId: string, folderId: string = 'root') {
    const client = await getAuthenticatedClient(userId);
    if (!client) {
        throw new Error('User is not authenticated with Google.');
    }

    const drive = google.drive({ version: 'v3', auth: client });

    try {
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
        
        return files;
    } catch (error: any) {
        console.error("Google Drive API error:", error);
        throw new Error('Failed to fetch files from Google Drive.');
    }
}
