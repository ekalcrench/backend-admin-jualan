export const sortMap = {
  createdAt: {
    createdAt: 'asc',
  },
  '-createdAt': {
    createdAt: 'desc',
  },
  name: {
    name: 'asc',
  },
  '-name': {
    name: 'desc',
  },
  email: {
    email: 'asc',
  },
  '-email': {
    email: 'desc',
  },
} as const;
