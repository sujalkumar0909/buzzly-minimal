// src/app/api/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import getChatMessageModel from '@/models/Message';
import Conversation from '@/models/Conversation'; // Import Conversation model
import User from '@/models/User'; // To get participant names if needed
import { Types } from 'mongoose';
import { Message as ClientMessage } from '@/lib/types';
import { generateChatIdentifier } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const fromUserId = request.headers.get('X-User-Id');
  const fromUsername = request.headers.get('X-Username');
  
  if (!fromUserId || !fromUsername) return NextResponse.json({ success: false, message: 'Sender auth missing.' }, { status: 401 });

  const body = await request.json();
  const { toUserId, content, tempId } = body;
  
  if (!toUserId || !content ) return NextResponse.json({ success: false, message: 'Missing toUserId or content.' }, { status: 400 });

  // Generate the consistent chat/collection identifier using User IDs
  const collectionIdentifier = generateChatIdentifier(fromUserId, toUserId);
  // The chatId field in the request body from client should match this.
  // If client sends its own chatId, ensure it's the same as server-generated for consistency.
  // For simplicity, we use the server-generated one.
  const confirmedChatId = collectionIdentifier;

  try {
    await dbConnect();

    const fromUserDoc = await User.findById(fromUserId).select('name username').lean();
    const toUserDoc = await User.findById(toUserId).select('name username').lean();

    if(!fromUserDoc || !toUserDoc){
        return NextResponse.json({ success: false, message: 'Sender or receiver not found.' }, { status: 404 });
    }

    const ChatMessageModel = getChatMessageModel(confirmedChatId);
    const messageToSave = new ChatMessageModel({
      sender: new Types.ObjectId(fromUserId), senderUsername: fromUserDoc.username,
      receiver: new Types.ObjectId(toUserId), content: content.trim(), timestamp: new Date(),
    });
    const savedMessage = await messageToSave.save();
    
    const sortedParticipantIds = [new Types.ObjectId(fromUserId), new Types.ObjectId(toUserId)].sort((a,b) => a.toString().localeCompare(b.toString()));
    const sortedParticipantUsernames = [fromUserDoc.username, toUserDoc.username].sort() as [string, string];
    const sortedParticipantNames = [fromUserDoc.name, toUserDoc.name].sort() as [string, string];

    await Conversation.findOneAndUpdate(
      { chatCollectionId: confirmedChatId },
      {
        $set: {
          participants: sortedParticipantIds,
          participantUsernames: sortedParticipantUsernames,
          participantNames: sortedParticipantNames,
          lastMessage: {
            contentSnippet: content.trim().substring(0, 70),
            senderId: savedMessage.sender, // ObjectId
            senderUsername: savedMessage.senderUsername,
            timestamp: savedMessage.timestamp,
          },
          lastActivity: savedMessage.timestamp,
        },
        $setOnInsert: { createdAt: new Date(), chatCollectionId: confirmedChatId } // chatCollectionId only on insert
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const confirmedMessagePayload: ClientMessage = {
      _id: (savedMessage._id as any).toString(), tempId: tempId, chatId: confirmedChatId,
      fromUserId: savedMessage.sender.toString(), fromUsername: savedMessage.senderUsername,
      toUserId: savedMessage.receiver.toString(), content: savedMessage.content,
      timestamp: savedMessage.timestamp.toISOString(), status: 'sent',
    };

    return NextResponse.json({ success: true, message: confirmedMessagePayload }, { status: 201 });

  } catch (error: any) {
    console.error("API /messages/send Error:", error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Failed to send message.' , originalTempId: tempId }, { status: 500 });
  }
}