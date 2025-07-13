
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import * as ical from 'ical';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { icsContent } = body;

        if (!icsContent || typeof icsContent !== 'string') {
            return NextResponse.json({ success: false, message: 'ICS content is required and must be a string.' }, { status: 400 });
        }
        
        let content = icsContent;
        // Remove BOM (Byte Order Mark) if it exists at the start of the file.
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
        }

        // 1. Normalize all possible line endings to CRLF (\r\n), which `ical` expects.
        // This is a more robust way to handle mixed line endings.
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
        
        // 2. Unfold lines. A folded line is a newline followed by a space or a tab.
        // We replace this sequence with an empty string to join the lines.
        const unfoldedContent = normalizedContent.replace(/\r\n[ \t]/g, '');
        
        const finalContent = unfoldedContent.trim();
        
        if (!finalContent) {
            return NextResponse.json({ success: true, data: {}, message: 'The provided calendar file is empty.' });
        }
        
        const parsedData = ical.parseICS(finalContent);

        const hasEvents = Object.values(parsedData).some(item => item.type === 'VEVENT');
        if (!hasEvents) {
            return NextResponse.json({ success: true, data: {}, message: 'No importable events found in the file.' });
        }

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Error parsing ICS file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
        
        if (errorMessage.includes("Invalid VCALENDAR")) {
             return NextResponse.json({ success: false, message: 'Invalid iCalendar format. The file may be corrupt or not a valid .ics file.' }, { status: 400 });
        }
        
        // The error message the user sees comes from this block.
        if (errorMessage.includes("getLineBreakChar")) {
             return NextResponse.json({ success: false, message: 'Failed to parse calendar due to inconsistent line endings. Please try exporting the file again.' }, { status: 400 });
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
