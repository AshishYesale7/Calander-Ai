'use server';

import { listGoogleDriveFiles } from '@/services/googleDriveService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, folderId = 'root' } = await request.json();
        
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }

        const files = await listGoogleDriveFiles(userId, folderId);
        
        return NextResponse.json({ success: true, files });

    } catch (error: any) {
        console.error("Google Drive API route error:", error);
        return NextResponse.json({ success: false, message: error.message || 'Failed to fetch files from Google Drive.' }, { status: 500 });
    }
}
