export const USER_STATUSES = [
  'active',
  'inactive',
  'suspended',
  'pending_approval',
  'banned',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDERS = [
  'local',
  'google',
  'facebook',
  'apple',
  'github',
] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const ADDRESS_TYPES = ['home', 'work', 'other'] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

export const GENDERS = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
] as const;

export type Gender = (typeof GENDERS)[number];
