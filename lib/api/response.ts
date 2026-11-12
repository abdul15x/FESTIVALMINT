import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, message = 'OK', status = 200) {
  return NextResponse.json({ data, error: null, message }, { status });
}

export function apiError(
  error: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503 | 504 = 400
) {
  return NextResponse.json({ data: null, error, message }, { status });
}
