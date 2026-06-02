import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// ── Types ───────────────────────────────────────────
export interface IBadge {
  id: string;
  name: string;
  emoji: string;
  earnedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  offlinePinHash: string | null;
  role: "student" | "admin";
  xp: number;
  streak: number;
  badges: IBadge[];
  downloadedCourses: mongoose.Types.ObjectId[];
  lastSyncedAt: Date | null;
  lastActiveAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  comparePin(pin: string | number): Promise<boolean>;
  setPin(pin: string | number): Promise<void>;
  toSafeObject(): Record<string, unknown>;
}

// ── Badge subdocument ───────────────────────────────
const badgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "🏅" },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ── User schema ─────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },

    // Hashed 4-digit PIN for offline login — validated on device
    offlinePinHash: { type: String, default: null, select: false },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    xp: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    badges: [badgeSchema],

    // Courses the student has downloaded (for analytics)
    downloadedCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],

    lastSyncedAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ── Hooks ───────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Methods ─────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.comparePin = function (pin: string | number): Promise<boolean> {
  if (!this.offlinePinHash) return Promise.resolve(false);
  return bcrypt.compare(String(pin), this.offlinePinHash);
};

userSchema.methods.setPin = async function (pin: string | number): Promise<void> {
  if (String(pin).length !== 4 || isNaN(Number(pin))) {
    throw new Error("PIN must be exactly 4 digits");
  }
  this.offlinePinHash = await bcrypt.hash(String(pin), 10);
};

userSchema.methods.toSafeObject = function (): Record<string, unknown> {
  const obj = this.toObject();
  delete obj.password;
  delete obj.offlinePinHash;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
