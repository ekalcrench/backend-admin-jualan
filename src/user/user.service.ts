import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as argon2 from 'argon2';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  private toResponse(user: any): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toResponse(user));
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const sameEmailUser = await this.userRepository.findByEmail(dto.email);

      if (sameEmailUser && sameEmailUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const user = await this.userRepository.update(id, dto);

    return this.toResponse(user);
  }

  async delete(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);

    return {
      message: 'User deleted successfully',
    };
  }
}
