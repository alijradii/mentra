import type { 
  UserDTO, 
  AuthResponse, 
  RegisterInput, 
  LoginInput 
} from "shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || "An error occurred",
      data.details
    );
  }

  return data;
}

export const authApi = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getCurrentUser(token: string): Promise<{ user: UserDTO }> {
    return fetchApi<{ user: UserDTO }>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async verifyEmail(token: string): Promise<{ message: string; user: UserDTO }> {
    return fetchApi<{ message: string; user: UserDTO }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(authToken: string): Promise<{ message: string }> {
    return fetchApi<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },
};

export { ApiError };
