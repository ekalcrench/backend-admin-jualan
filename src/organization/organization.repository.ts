import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany();
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
