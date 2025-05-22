// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { UserSearchResultItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  // The client *might* still send X-Current-User-Id to help exclude self from results,
  // but the API route will not enforce its presence for authentication.
  const selfUserIdToExclude = request.headers.get('X-Current-User-Id');

  console.log(`API SEARCH (No Auth): Query: "${query}", UserToExclude (header): "${selfUserIdToExclude}"`);

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { success: false, message: 'Search query must be at least 2 characters.' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const searchRegex = new RegExp(query.trim(), 'i');

    const findQuery: any = { // Build query dynamically
      $or: [{ username: searchRegex }, { name: searchRegex }]
    };

    if (selfUserIdToExclude && selfUserIdToExclude !== "null" && selfUserIdToExclude !== "undefined") {
      findQuery._id = { $ne: selfUserIdToExclude };
    }

    const usersFromDb = await User.find(findQuery)
    .select('_id username name createdAt')
    .limit(10)
    .lean();

    const usersToReturn: UserSearchResultItem[] = usersFromDb.map(u => ({
        _id: u._id.toString(), username: u.username, name: u.name, createdAt: u.createdAt
    }));

    console.log(`API SEARCH (No Auth): Found ${usersToReturn.length} users.`);
    return NextResponse.json({ success: true, users: usersToReturn }, { status: 200 });

  } catch (error: any) {
    console.error("API SEARCH Error:", error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Error searching users.'}, { status: 500 });
  }
}