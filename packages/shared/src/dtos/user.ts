import type { User, UserDTO } from "../types/user";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
