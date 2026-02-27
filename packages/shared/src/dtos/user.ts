import type { User, UserDTO } from "../types/user";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
