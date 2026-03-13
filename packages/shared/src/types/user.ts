export interface User {
  _id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
  /** Whether the user has access to pro features (e.g. AI tools). */
  isPro: boolean;
  /** Remaining AI credits for the current free tier window (free mentors only). */
  aiCredits?: number;
  /** ISO timestamp of the last time AI credits were reset. */
  aiCreditsLastReset?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
  /** Whether the user has access to pro features (e.g. AI tools). */
  isPro: boolean;
  /** Remaining AI credits for the current free tier window (free mentors only). */
  aiCredits?: number;
  /** ISO timestamp of the last time AI credits were reset. */
  aiCreditsLastReset?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}
