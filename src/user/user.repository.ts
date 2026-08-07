import { Prisma } from '@/generated/prisma/client.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  // findById(id: string) {
  //   return this.prisma.user.findUnique({
  //     where: { id },
  //   });
  // }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  // update(id: string, data: Prisma.UserUpdateInput) {
  //   return this.prisma.user.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // delete(id: string) {
  //   return this.prisma.user.delete({
  //     where: { id },
  //   });
  // }
}
