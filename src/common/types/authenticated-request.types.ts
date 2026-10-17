export type AuthenticatedRequest = Request & {
  user: { organizationId?: string };
};
