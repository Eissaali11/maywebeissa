import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '../../../../modules/auth';

export const { GET, POST } = toNextJsHandler(getAuth());
