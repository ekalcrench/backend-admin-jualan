export type FindByPagesParams = {
  page: number;
  size: number;
  sortBy: string;
  search?: string;
  organizationId: string;
  isActive?: boolean;
};
