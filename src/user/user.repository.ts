import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { sortMap } from './constants/sort.map.constants.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, role, status } = data;

    const skip = (page - 1) * size;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
          ...(role && { role }),
          ...(status && { status }),
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOrganizationsById(id: string) {
    return this.prisma.organization
      .findMany({
        where: {
          organizationUsers: {
            some: { userId: id },
          },
        },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          organizationUsers: {
            where: { userId: id },
            select: {
              role: true,
              status: true,
            },
          },
        },
      })
      .then((organizations) =>
        organizations.map(({ organizationUsers, ...organization }) => ({
          ...organization,
          role: organizationUsers[0].role,
          status: organizationUsers[0].status,
        })),
      );
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
