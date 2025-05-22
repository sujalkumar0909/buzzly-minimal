// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/models/User'; // IUser is the Mongoose document interface
import { AuthenticatedUser } from '@/lib/types'; // This is the type for client-side state

export async function POST(request: NextRequest) {
  console.log("API LOGIN: /api/auth/login invoked");
  try {
    await dbConnect();
    const body = await request.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json({ success: false, message: 'Email/Username and password are required.' }, { status: 400 });
    }

    // --- FIX APPLIED HERE ---
    // Use type assertion `as IUser | null` to assure TypeScript of the type.
    // Also, you can remove the explicit type annotation for userDoc if you use `as`
    // because its type will be inferred from the assertion.
    const userDoc = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    }).select('+password') as IUser | null; // <-- Type assertion added

    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    // At this point, userDoc is guaranteed to be IUser (not null)
    const isMatch = await userDoc.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    // User is authenticated, prepare data to send to client
    // This matches the AuthenticatedUser interface in lib/types.ts
    // Ensure all properties accessed on userDoc (name, username, email, createdAt, _id)
    // are defined as required in your IUser interface.
    const userToReturn: AuthenticatedUser = {
      userId: userDoc._id.toString(), // Ensure _id is converted to string
      username: userDoc.username,     // Assumes username is required in IUser
      name: userDoc.name,             // Assumes name is required in IUser
      email: userDoc.email,           // Assumes email is required in IUser
      createdAt: userDoc.createdAt,   // Assumes createdAt is required in IUser
    };

    console.log("API LOGIN: Login successful for user:", userDoc.username);
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful! Setting up your session.',
        user: userToReturn, // Send user data back to client
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("API LOGIN Error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred during login.' },
      { status: 500 }
    );
  }
}