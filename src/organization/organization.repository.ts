import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { organizationInclude } from './constants/response-include.constants.js';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search } = data;

    const skip = (page - 1) * size;

    const where: Prisma.OrganizationWhereInput = search
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
            {
              address: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: search,
              },
            },
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              socialMedias: {
                some: {
                  username: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
        include: organizationInclude,
      }),

      this.prisma.organization.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: organizationInclude,
    });
  }

  create(data: Prisma.OrganizationCreateInput) {
    return this.prisma.organization.create({
      data,
      include: organizationInclude,
    });
  }

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return this.prisma.organization.update({
      where: { id },
      data,
      include: organizationInclude,
    });
  }

  delete(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
