import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  USER_STATUS,
  USER_STATUSES,
  AUTH_PROVIDER,
  AUTH_PROVIDERS,
  ADDRESS_TYPE,
  ADDRESS_TYPES,
  GENDER,
  GENDERS,
} from '#constants/user.constant.js';
import type {
  UserStatus,
  AuthProvider,
  AddressType,
  Gender,
} from '#constants/user.constant.js';

export {
  USER_STATUS,
  USER_STATUSES,
  AUTH_PROVIDER,
  AUTH_PROVIDERS,
  ADDRESS_TYPE,
  ADDRESS_TYPES,
  GENDER,
  GENDERS,
};

export type {
  UserStatus,
  AuthProvider,
  AddressType,
  Gender,
};

export interface IUserAddress {
  _id?: Types.ObjectId;
  type: AddressType;
  isDefault: boolean;
  fullName?: string;
  phone?: string;
  street: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IUserProfile {
  avatar?: string | null;
  bio?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
}

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  name: string;
  fullName: string;
  email: string;
  phone?: string | null;
  phoneVerifiedAt?: Date | null;
  isPhoneVerified: boolean;
  password?: string;
  status: UserStatus;
  authProvider: AuthProvider;
  providerId?: string | null;
  emailVerifiedAt?: Date | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  passwordChangedAt?: Date | null;
  profile: IUserProfile;
  addresses: IUserAddress[];
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): Record<string, unknown>;
}

const userAddressSchema = new Schema<IUserAddress>(
  {
    type: {
      type: String,
      enum: ADDRESS_TYPES,
      default: ADDRESS_TYPE.HOME,
    },
    isDefault: { type: Boolean, default: false },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'US' },
  },
  { _id: true, timestamps: true }
);

const userProfileSchema = new Schema<IUserProfile>(
  {
    avatar: { type: String, trim: true, default: null },
    bio: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: GENDERS,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
      index: true,
    },
    password: {
      type: String,
      select: false,
      required: function (this: IUserDocument) {
        return this.authProvider === 'local';
      },
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    authProvider: {
      type: String,
      enum: AUTH_PROVIDERS,
      default: AUTH_PROVIDER.LOCAL,
      index: true,
    },
    providerId: {
      type: String,
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    profile: {
      type: userProfileSchema,
      default: () => ({}),
    },
    addresses: {
      type: [userAddressSchema],
      default: [],
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for name (compatibility with single-string name interfaces)
userSchema
  .virtual('name')
  .get(function (this: IUserDocument) {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  })
  .set(function (this: IUserDocument, fullName: string) {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      this.firstName = parts[0] || '';
      this.lastName = parts.slice(1).join(' ');
    }
  });

// Virtual for isEmailVerified (derived from emailVerifiedAt timestamp)
userSchema
  .virtual('isEmailVerified')
  .get(function (this: IUserDocument) {
    return Boolean(this.emailVerifiedAt);
  })
  .set(function (this: IUserDocument, verified: boolean) {
    this.emailVerifiedAt = verified ? (this.emailVerifiedAt || new Date()) : null;
  });

// Virtual for isPhoneVerified (derived from phoneVerifiedAt timestamp)
userSchema
  .virtual('isPhoneVerified')
  .get(function (this: IUserDocument) {
    return Boolean(this.phoneVerifiedAt);
  })
  .set(function (this: IUserDocument, verified: boolean) {
    this.phoneVerifiedAt = verified ? (this.phoneVerifiedAt || new Date()) : null;
  });

// Multi-attribute and sparse indexes
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ authProvider: 1, providerId: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1, emailVerificationExpires: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1, passwordResetExpires: 1 }, { sparse: true });
userSchema.index({ deletedAt: 1, status: 1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
