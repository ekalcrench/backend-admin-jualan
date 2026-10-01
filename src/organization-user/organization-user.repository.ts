import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { sortMap } from './constants/sort.map.constants.js';

@Injectable()
export class OrganizationUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;

    const skip = (page - 1) * size;

    const where: Prisma.OrganizationUserWhereInput = {
      organizationId,
      ...(search && {
        user: {
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
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizationUser.findMany({
        skip,
        take: size,
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          user: sortMap[sortBy] ?? sortMap['-createdAt'],
        },
      }),

      this.prisma.organizationUser.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  findById(id: string) {
    return this.prisma.organizationUser.findUnique({
      where: { id },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.organizationUser.findFirst({
      where: { userId },
    });
  }

  create(data: Prisma.OrganizationUserCreateInput) {
    return this.prisma.organizationUser.create({
      data,
    });
  }

  update(id: string, data: Prisma.OrganizationUserUpdateInput) {
    return this.prisma.organizationUser.update({
      where: { id },
      data,
    });
  }
}
