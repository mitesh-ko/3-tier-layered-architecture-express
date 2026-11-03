export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval',
  BANNED: 'banned',
} as const;

export const USER_STATUSES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.INACTIVE,
  USER_STATUS.SUSPENDED,
  USER_STATUS.PENDING_APPROVAL,
  USER_STATUS.BANNED,
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDER = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
  GITHUB: 'github',
} as const;

export const AUTH_PROVIDERS = [
  AUTH_PROVIDER.LOCAL,
  AUTH_PROVIDER.GOOGLE,
  AUTH_PROVIDER.FACEBOOK,
  AUTH_PROVIDER.APPLE,
  AUTH_PROVIDER.GITHUB,
] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const ADDRESS_TYPE = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other',
} as const;

export const ADDRESS_TYPES = [
  ADDRESS_TYPE.HOME,
  ADDRESS_TYPE.WORK,
  ADDRESS_TYPE.OTHER,
] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export const GENDERS = [
  GENDER.MALE,
  GENDER.FEMALE,
  GENDER.OTHER,
  GENDER.PREFER_NOT_TO_SAY,
] as const;

export type Gender = (typeof GENDERS)[number];
