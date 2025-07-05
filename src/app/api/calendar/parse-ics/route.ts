
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
        // Remove BOM (Byte Order Mark) if it exists
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
        }

        // Robustly normalize all possible line endings to CRLF, which is the iCalendar standard.
        const normalizedIcsContent = content.replace(/\r\n|\r/g, '\n').replace(/\n/g, '\r\n');
        
        const finalContent = normalizedIcsContent.trim();
        
        if (!finalContent) {
            return NextResponse.json({ success: true, data: {}, message: 'The provided calendar file is empty.' });
        }
        
        const parsedData = ical.parseICS(finalContent);

        const hasEvents = Object.values(parsedData).some(item => item.type === 'VEVENT');
        if (!hasEvents) {
            // This is not an error, just an empty file.
            return NextResponse.json({ success: true, data: {}, message: 'No importable events found in the file.' });
        }

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Error parsing ICS file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
        
        // Provide more specific feedback for common parsing errors
        if (errorMessage.includes("Invalid VCALENDAR")) {
             return NextResponse.json({ success: false, message: 'Invalid iCalendar format. The file may be corrupt or not a valid .ics file.' }, { status: 400 });
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
