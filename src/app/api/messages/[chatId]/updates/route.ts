// src/app/api/messages/[chatId]/updates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import getChatMessageModel from '@/models/Message';
import { LeanMessage } from '@/lib/types';

export async function GET(
    request: NextRequest,
    { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const requestingUserId = request.headers.get('X-Current-User-Id');
  const { searchParams } = new URL(request.url);
  const sinceTimestamp = searchParams.get('since'); // ISO timestamp string

  console.log(`API UPDATES: ChatID: "${chatId}", ReqUser: "${requestingUserId}", Since: "${sinceTimestamp}"`);

  if (!requestingUserId || !chatId || !sinceTimestamp) {
    return NextResponse.json({ success: false, message: 'Missing required parameters (chatId, since, or auth header).' }, { status: 400 });
  }
  if (!chatId.includes(requestingUserId)) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    await dbConnect();
    const ChatMessageModel = getChatMessageModel(chatId);
    const sinceDate = new Date(sinceTimestamp);
    if (isNaN(sinceDate.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid "since" timestamp format.'}, { status: 400});
    }

    const newMessages = await ChatMessageModel.find({
      timestamp: { $gt: sinceDate } // Get messages greater than the 'since' timestamp
    })
    .sort({ timestamp: 1 }) // Send them in chronological order (oldest new to newest new)
    .select('_id content timestamp sender senderUsername')
    .lean();
    
    const messagesForClient: LeanMessage[] = newMessages.map(m => ({
        _id: m._id.toString(), content: m.content, timestamp: m.timestamp.toISOString(),
        fromUserId: (m.sender as any).toString(), fromUsername: m.senderUsername,
    }));

    return NextResponse.json({ success: true, messages: messagesForClient }, { status: 200 });

  } catch (error: any) {
    console.error(`API UPDATES Error for ${chatId}:`, error.message);
    return NextResponse.json({ success: false, message: 'Error fetching message updates.'}, { status: 500 });
  }
}