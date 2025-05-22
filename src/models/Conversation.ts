// src/models/Conversation.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface ILastMessage {
  contentSnippet: string;
  senderId: Types.ObjectId; // Keep as ObjectId
  senderUsername?: string; // Optional denormalization
  timestamp: Date;
}

const LastMessageSchema = new Schema<ILastMessage>({
  contentSnippet: { type: String, trim: true, maxlength: 100 },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  senderUsername: { type: String },
  timestamp: { type: Date },
}, { _id: false });

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: [Types.ObjectId, Types.ObjectId];
  participantUsernames: [string, string]; // [username1, username2] sorted alphabetically
  participantNames?: [string, string];    // [name1, name2] corresponding to usernames
  chatCollectionId: string; // "userId1_userId2" sorted, also used for dynamic message collection name
  lastMessage?: ILastMessage;
  lastActivity: Date;
  // unreadCount: { [userId: string]: number }; // More complex, for later if needed
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId], ref: 'User', required: true,
      validate: [(arr: Types.ObjectId[]) => arr.length === 2, 'Participants array must be two user IDs.'],
      index: true,
    },
    participantUsernames: { // Store sorted usernames to make chatCollectionId predictable if based on usernames
      type: [String], required: true,
      validate: [(arr: string[]) => arr.length === 2, 'ParticipantUsernames array must be two usernames.'],
    },
    participantNames: { type: [String] },
    chatCollectionId: { type: String, required: true, unique: true, index: true },
    lastMessage: { type: LastMessageSchema, required: false },
    lastActivity: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, lastActivity: -1 }); // For querying user's conversations

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;