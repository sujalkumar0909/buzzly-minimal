// src/app/api/messages/[chatId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import getChatMessageModel from '@/models/Message';
import { LeanMessage } from '@/lib/types'; // For structuring the response

export async function GET(
    request: NextRequest,
    { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const requestingUserId = request.headers.get('X-Current-User-Id'); // Client still sends for context/auth

  try {
    if (!requestingUserId) {
      return NextResponse.json({ success: false, message: 'Auth ID required.' }, { status: 401 });
    }
    if (!chatId || typeof chatId !== 'string' || chatId === 'undefined') {
      return NextResponse.json({ success: false, message: 'Valid Chat ID required.' }, { status: 400 });
    }
    if (!chatId.includes(requestingUserId)) { // Basic auth check
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    await dbConnect();
    const ChatMessageModel = getChatMessageModel(chatId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;
    const sinceTimestampISO = searchParams.get('since'); // New parameter

    let queryFilter: any = {};
    let sortOrder: any = { timestamp: -1 }; // Default: newest first for pagination

    if (sinceTimestampISO) {
      try {
        const sinceDate = new Date(sinceTimestampISO);
        if (isNaN(sinceDate.getTime())) throw new Error("Invalid 'since' date format");
        queryFilter.timestamp = { $gt: sinceDate }; // Get messages greater than this timestamp
        sortOrder = { timestamp: 1 }; // For "newer than", get oldest of the new ones first
        // For "newer than" queries, pagination (skip/limit) might behave differently
        // or might not be needed if you expect only a few new messages.
        // For this simple poll, we'll fetch all newer and the client will merge.
        // So, remove skip/limit for "since" query for simplicity for now.
        // skip = 0; // effectively
        // limit = 0; // Mongoose specific: 0 means no limit. For safety, set a high limit
        // Or fetch with a reasonable limit for new messages, e.g., 50.
        // We'll stick with existing limit for now, client can just take page 1.
        console.log(`API MESSAGES: Fetching messages since ${sinceTimestampISO} for chat ${chatId}`);
      } catch (e) {
        return NextResponse.json({ success: false, message: "Invalid 'since' timestamp format." }, { status: 400 });
      }
    }


    const messagesFromDb = await ChatMessageModel.find(queryFilter)
        .sort(sortOrder)
        .skip(sinceTimestampISO ? 0 : skip) // No skip if fetching "since" (get all newer)
        .limit(limit) // Limit still applies
        .select('_id content timestamp sender senderUsername')
        .lean();

    const totalMessages = await ChatMessageModel.countDocuments({chatId}); // Total in this chat

    const messagesForClient: LeanMessage[] = messagesFromDb.map(m => ({
        _id: m._id.toString(), content: m.content, timestamp: m.timestamp.toISOString(),
        fromUserId: (m.sender as any).toString(), fromUsername: m.senderUsername,
    }));

    // If fetching "since", messagesForClient are already sorted oldest-newest in the new batch.
    // If paginating (no "since"), we fetched newest first, so reverse for client to prepend.
    const finalMessages = sinceTimestampISO ? messagesForClient : messagesForClient.reverse();

    return NextResponse.json({
        success: true,
        messages: finalMessages,
        // Pagination info is more relevant when not using 'since'
        currentPage: sinceTimestampISO ? 1 : page, // If 'since', it's like page 1 of new batch
        totalPages: sinceTimestampISO ? 1 : Math.ceil(totalMessages / limit), // Simplify for 'since'
        totalMessages: sinceTimestampISO ? messagesForClient.length : totalMessages, // Count of returned or total
        isDeltaUpdate: !!sinceTimestampISO, // Flag to tell client this is an update
    }, { status: 200 });

  } catch (error: any) {
    console.error(`API MESSAGES (FETCH) Error for ${chatId}:`, error.message);
    return NextResponse.json({ success: false, message: 'Error fetching messages.'}, { status: 500 });
  }
}