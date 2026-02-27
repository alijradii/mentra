export interface User {
  _id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
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
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}
