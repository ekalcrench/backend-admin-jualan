import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as argon2 from 'argon2';
import { UserResponseDto } from './dto/user-response.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { OrganizationUserRepository } from './organization-user.repository.js';

@Injectable()
export class OrganizationUserService {
  constructor(
    private readonly organizationUserRepository: OrganizationUserRepository,
  ) {}

  private toResponse(user: any): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findByPages(dto: GetByPagesDto) {
    const { items, total } =
      await this.organizationUserRepository.findByPages(dto);

    return {
      items,
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string) {
    const user = await this.organizationUserRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.organizationUserRepository.findByEmail(
      dto.email,
    );

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.organizationUserRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existingUser = await this.organizationUserRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const sameEmailUser = await this.organizationUserRepository.findByEmail(
        dto.email,
      );

      if (sameEmailUser && sameEmailUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const user = await this.organizationUserRepository.update(id, dto);

    return this.toResponse(user);
  }

  async delete(id: string) {
    const user = await this.organizationUserRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.organizationUserRepository.delete(id);

    return {
      message: 'User deleted successfully',
    };
  }
}
