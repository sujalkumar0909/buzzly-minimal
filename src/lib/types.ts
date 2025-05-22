// src/lib/types.ts
import { Types } from 'mongoose'; // Mongoose specific, for backend model definitions

// --- User Related ---
export interface AuthenticatedUser {
  userId: string;
  username: string;
  name: string;
  email: string; // Ensure login API populates this
  createdAt: Date | string; // API sends string, client might parse to Date
}

export interface ClientUser { // For displaying other users (e.g., search results)
  _id: string; // MongoDB ObjectId as string
  username: string;
  name: string;
  createdAt?: Date | string;
}

// --- Message Related ---
export type MessageStatus = 'sending' | 'sent' | 'failed'; // Simplified status

export interface Message {
  _id?: string;          // Database ID (string version of ObjectId) if confirmed
  tempId?: string;       // Client-generated temporary ID for optimistic updates
  chatId: string;       // Identifier for the chat/collection (e.g., "userId1_userId2")
  fromUserId: string;
  fromUsername: string;
  toUserId: string;       // Recipient ID, essential for client state
  content: string;
  timestamp: Date | string; // API likely sends string, client should work with Date
  status?: MessageStatus;
}

// For messages directly from API before full client-side Message object construction
export interface LeanMessage {
  _id: string;
  content: string;
  timestamp: string; // ISO string from API
  fromUserId: string;
  fromUsername: string;
  // Note: chatId and toUserId will be added by client from context
}

// --- Chat State Related (Client-Side) ---
export interface UnreadCounts {
    [chatId: string]: number; // chatId maps to count of unread messages
}

// --- API Response Structures ---
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string; // General message or error details string
  data?: T;
  user?: AuthenticatedUser; // Specifically for login/signup API responses
  error?: string; // Alternative to message for errors
  errors?: Record<string, string>; // For field-specific validation errors
  originalTempId?: string; // Used in SendMessageApiResponse if message sending failed
}

export type UserSearchResultItem = Pick<ClientUser, '_id' | 'username' | 'name' | 'createdAt'>;
export interface UserSearchApiResponse extends ApiResponse<{ users: UserSearchResultItem[] }> {}

export interface MessagesApiResponse extends ApiResponse<{
    messages: LeanMessage[];
    currentPage: number;
    totalPages: number;
    totalMessages: number;
}> {}

// For the response from /api/messages/send
export interface SendMessageApiSuccessResponse extends ApiResponse<{ message: Message }> {} // 'message' is the confirmed Message
export interface SendMessageApiErrorResponse extends ApiResponse<null> { originalTempId?: string }


// --- Mongoose Document Interfaces (primarily for backend / model files) ---
// These are just examples of how you might structure them.
// Typically, these live directly in src/models/User.ts and src/models/Message.ts
export interface IUserDocumentBase {
  name: string;
  email: string;
  username: string;
  password?: string; // Hashed password
  createdAt: Date;
}
// In User.ts: export interface IUser extends IUserDocumentBase, mongoose.Document { _id: Types.ObjectId; ... }


export interface IMessageDocumentBase {
  // No chatId field if collection name IS the chat ID
  sender: Types.ObjectId;
  senderUsername: string;
  receiver: Types.ObjectId;
  content: string;
  timestamp: Date;
  read: boolean; // Default to false
}
// In Message.ts (model factory): export interface IChatMessage extends IMessageDocumentBase, mongoose.Document { _id: Types.ObjectId }