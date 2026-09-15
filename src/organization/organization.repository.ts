import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany();
  }

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, name, email } = data;

    const skip = (page - 1) * size;

    const where: Prisma.OrganizationWhereInput = {
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      }),
      ...(email && {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
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
    return this.prisma.organization.findUnique({ where: { id } });
  }

  create(data: Prisma.OrganizationCreateInput) {
    return this.prisma.organization.create({ data });
  }

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return this.prisma.organization.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
