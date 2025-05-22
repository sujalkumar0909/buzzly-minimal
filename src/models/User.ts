// src/models/User.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
// Using TRUSTED_EMAIL_DOMAINS from a constant file is good practice
// For simplicity here, let's assume it's directly available or defined elsewhere if needed for validation.
// If not using strict email domain validation, this can be omitted.

// Match the IUserMongoose in lib/types.ts (or ensure it extends this)
export interface IUser extends Document {
  _id: Types.ObjectId; // Explicitly include _id
  name: string;
  email: string;
  username: string;
  password?: string; // Will be `select: false`
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name.'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long.'],
    maxlength: [50, 'Name cannot exceed 50 characters.']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address.'],
    unique: true,
    lowercase: true,
    trim: true,
    // Example validation for trusted domains (optional)
    // validate: {
    //   validator: function (email: string) {
    //     const TRUSTED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com']; // Example
    //     const domain = email.substring(email.lastIndexOf('@') + 1);
    //     return TRUSTED_DOMAINS.includes(domain.toLowerCase());
    //   },
    //   message: (props: { value: string }) =>
    //     `Email domain for ${props.value} is not supported.`,
    // },
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address.',
    ],
  },
  username: {
    type: String,
    required: [true, 'Please choose a username.'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters.'],
    maxlength: [20, 'Username cannot exceed 20 characters.'],
    match: [
      /^[a-zA-Z0-9_.]+$/, // Allow letters, numbers, underscore, period
      'Username can only contain letters, numbers, underscores, and periods.',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please create a password.'],
    minlength: [8, 'Password must be at least 8 characters.'],
    select: false, // Do not return password by default when querying users
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Method to compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    // This condition means password field was not selected in the query that fetched this user doc.
    // The login API route must use .select('+password')
    console.error("User.comparePassword: User's password was not available for comparison. Ensure it's selected.");
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent Mongoose OverwriteModelError
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;