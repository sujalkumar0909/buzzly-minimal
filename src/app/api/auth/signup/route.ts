// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User'; // Using your User Mongoose model
import { AuthenticatedUser } from '@/lib/types'; // For structuring the response

// You might want to define trusted domains in a constants file if using email domain validation
// const TRUSTED_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

export async function POST(request: NextRequest) {
  console.log("API SIGNUP: /api/auth/signup invoked");
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, username, password, confirmPassword } = body;

    // --- Basic Validation ---
    if (!name || !email || !username || !password || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'Please fill in all required fields.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'Passwords do not match.' }, { status: 400 });
    }
    // Consider adding email domain validation here if needed

    // Create new user instance (password will be hashed by pre-save hook in User model)
    const newUserDoc = new User({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password, // Pass plain password; Mongoose hook will hash it
    });

    await newUserDoc.save(); // This will also trigger Mongoose schema validations

    // Prepare user data to send back (matches AuthenticatedUser type)
    const userToReturn: AuthenticatedUser = {
      userId: newUserDoc._id.toString(),
      username: newUserDoc.username,
      name: newUserDoc.name,
      email: newUserDoc.email,
      createdAt: newUserDoc.createdAt,
    };
    
    console.log("API SIGNUP: User registered successfully:", newUserDoc.username);
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully! You can now log in.',
        user: userToReturn, // Optionally send back the created user data (without password)
      },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    console.error("API SIGNUP Error:", error.message);
    if (error.name === 'ValidationError') {
      let errors: { [key: string]: string } = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return NextResponse.json({ success: false, message: 'Validation failed.', errors }, { status: 400 });
    }
    if (error.code === 11000) { // MongoDB duplicate key error
      let field = Object.keys(error.keyValue)[0];
      field = field.charAt(0).toUpperCase() + field.slice(1);
      return NextResponse.json({ success: false, message: `${field} already exists. Please choose another.` }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred during signup.' }, { status: 500 });
  }
}