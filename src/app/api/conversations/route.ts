// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Conversation from '@/models/Conversation';
import User from '@/models/User'; // To populate other participant details
import { Types } from 'mongoose';
import { ClientUser } from '@/lib/types'; // For the response structure

export async function GET(request: NextRequest) {
  const currentUserId = request.headers.get('X-Current-User-Id');

  if (!currentUserId) {
    return NextResponse.json({ success: false, message: 'Auth ID required.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const conversations = await Conversation.find({
      participants: new Types.ObjectId(currentUserId) // Find convos where current user is a participant
    })
    .sort({ lastActivity: -1 }) // Sort by most recent activity
    .limit(20) // Limit to, e.g., 20 most recent conversations
    // .populate('participants', 'username name _id') // If you want to populate user details
    .lean();

    // We need to extract the *other* user's details from each conversation
    const recentChatPartners: ClientUser[] = [];
    for (const convo of conversations) {
        const otherParticipantId = convo.participants.find(pId => pId.toString() !== currentUserId);
        if (otherParticipantId) {
            // Find the corresponding username and name from the stored arrays
            let otherUsername = '';
            let otherName = '';
            const selfIndex = convo.participants[0].toString() === currentUserId ? 0 : 1;
            const otherIndex = selfIndex === 0 ? 1 : 0;
            
            if (convo.participantUsernames && convo.participantUsernames.length === 2) {
                otherUsername = convo.participantUsernames[otherIndex];
            }
            if (convo.participantNames && convo.participantNames.length === 2) {
                otherName = convo.participantNames[otherIndex];
            }

            // If username/name weren't stored or are incomplete, fetch from User model (fallback)
            if (!otherUsername || !otherName) {
                const otherUserDoc = await User.findById(otherParticipantId).select('username name createdAt').lean();
                if (otherUserDoc) {
                    recentChatPartners.push({
                        _id: otherUserDoc._id.toString(),
                        username: otherUserDoc.username,
                        name: otherUserDoc.name,
                        createdAt: otherUserDoc.createdAt.toISOString(),
                    });
                }
            } else {
                 recentChatPartners.push({
                    _id: otherParticipantId.toString(),
                    username: otherUsername,
                    name: otherName,
                    // createdAt is not available directly on convo for the other user
                    // You might store this on the Conversation doc or fetch User if needed
                });
            }
        }
    }
    return NextResponse.json({ success: true, users: recentChatPartners });

  } catch (error: any) {
    console.error("API CONVERSATIONS Error:", error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Error fetching recent conversations.'}, { status: 500 });
  }
}