export interface ApiResponse<T = unknown> {
  code: string;
  success: boolean;
  data?: T;
  message?: string;
}

export const success = <T>(data: T, status = 200): Response =>
  Response.json(
    {
      code: 'Success',
      success: true,
      data,
    } satisfies ApiResponse<T>,
    { status },
  );

export const fail = (code: string, message: string, status = 400): Response =>
  Response.json(
    {
      code,
      success: false,
      message,
    } satisfies ApiResponse<never>,
    { status },
  );
