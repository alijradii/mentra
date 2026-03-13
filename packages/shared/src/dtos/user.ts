import type { User, UserDTO } from "../types/user";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    isPro: user.isPro,
    aiCredits: user.aiCredits,
    aiCreditsLastReset: user.aiCreditsLastReset
      ? user.aiCreditsLastReset.toISOString()
      : undefined,
    createdAt: user.createdAt.toISOString(),
  };
}
