/**
 * API 요청/응답 공통 타입 (Route Handler, Server Actions 등).
 */

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: ApiError };
