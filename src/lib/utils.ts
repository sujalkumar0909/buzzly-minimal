// src/lib/utils.ts
import { format, isSameDay, isYesterday, differenceInMinutes } from 'date-fns';
import { Message } from './types'; // Import for shouldGroupMessages

/**
 * Generates a deterministic and MongoDB-safe collection name OR chat ID from two user IDs.
 * Sorts them alphabetically and joins them with an underscore.
 * @param userId1 First user's ID string
 * @param userId2 Second user's ID string
 * @returns A unique string identifier for the chat between the two users.
 * @throws Error if either userId is null, undefined, or empty.
 */
export const generateChatIdentifier = (userId1: string, userId2: string): string => {
  if (!userId1 || !userId2) {
    console.error("generateChatIdentifier: Called with missing user IDs.", { userId1, userId2 });
    throw new Error("Both user IDs must be provided to generate a chat identifier.");
  }
  // No need to clean User IDs as they are MongoDB ObjectIds (or their string representation)
  // which are already safe for collection names (if used that way) or as identifiers.
  return [userId1, userId2].sort().join('_');
};

export const formatDateSeparator = (dateInput: Date | string): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) throw new Error("Invalid date for separator"); // Handle invalid date
    if (isSameDay(date, new Date())) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error("Error in formatDateSeparator:", error);
    return "Date Error"; // Fallback
  }
};

export const formatMessageTimestamp = (dateInput: Date | string): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) throw new Error("Invalid date for timestamp");
    return format(date, 'p'); // 'p' is short time, e.g., 12:30 PM
  } catch (error) {
    console.error("Error in formatMessageTimestamp:", error);
    return "Time Error"; // Fallback
  }
};

export const debounce = <F extends (...args: any[]) => void>(func: F, waitFor: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeoutId !== null) { clearTimeout(timeoutId); }
    timeoutId = setTimeout(() => { func(...args); }, waitFor);
  };
  // Optional: Method to cancel the debounced function call if needed externally
  debounced.cancel = () => { if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; } };
  return debounced;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) { return error.message; }
  if (typeof error === 'string') { return error; }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return 'An unknown error occurred.';
};

// Optional utility for message grouping visuals - adjust timestamp conversion as needed
export const shouldGroupMessages = (
    currentMessage: Message | null,
    previousMessage: Message | null,
    groupTimeLimitMinutes: number = 5
): boolean => {
    if (!currentMessage || !previousMessage || !currentMessage.timestamp || !previousMessage.timestamp) {
        return false;
    }
    if (currentMessage.fromUserId !== previousMessage.fromUserId) {
        return false;
    }
    try {
        const currentTime = new Date(currentMessage.timestamp);
        const previousTime = new Date(previousMessage.timestamp);
        if (isNaN(currentTime.getTime()) || isNaN(previousTime.getTime())) return false;
        return differenceInMinutes(currentTime, previousTime) <= groupTimeLimitMinutes;
    } catch (e) {
        return false; // Invalid date objects
    }
};