import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '../../../../lib/auth/auth-runtime';

export const GET = (request: Request) => {
  const auth = getAuth();
  return toNextJsHandler(auth.handler).GET(request);
};

export const POST = (request: Request) => {
  const auth = getAuth();
  return toNextJsHandler(auth.handler).POST(request);
};
