import { UserRequestHeader } from './user-request-header.types.js';

export type AuthenticatedRequest = Request & {
  user: UserRequestHeader;
};
