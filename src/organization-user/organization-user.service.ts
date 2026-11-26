import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationUserDto } from './dto/create-organization-user.dto.js';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto.js';
import { GetOrganizationUserByPagesDto } from './dto/get-organization-user-by-pages.dto.js';
import { OrganizationUserRepository } from './organization-user.repository.js';
import { OrganizationUserStatus } from '../../prisma/generated/prisma/enums.js';
import { OrganizationUserResponseDto } from './dto/organization-user-response.dto.js';
import { UserRequestHeader } from '../common/types/user-request-header.types.js';

@Injectable()
export class OrganizationUserService {
  constructor(
    private readonly organizationUserRepository: OrganizationUserRepository,
  ) {}

  private toResponse(
    organizationUser: NonNullable<
      Awaited<ReturnType<OrganizationUserRepository['findById']>>
    >,
  ): OrganizationUserResponseDto {
    return {
      id: organizationUser.id,
      userId: organizationUser.userId,
      role: organizationUser.role,
      status: organizationUser.status,
      approvedAt: organizationUser.approvedAt,
      approvedById: organizationUser.approvedById,
      approvedBy: organizationUser.approvedBy?.name ?? null,
      updatedById: organizationUser.updatedById,
      updatedBy: organizationUser.updatedBy?.name ?? null,
      createdAt: organizationUser.createdAt,
      updatedAt: organizationUser.updatedAt,
      name: organizationUser.user.name,
      email: organizationUser.user.email,
      organizationId: organizationUser.organizationId,
    };
  }

  async findByPages(
    dto: GetOrganizationUserByPagesDto,
    jwtPayload: { organizationId?: string },
  ) {
    const { organizationId } = jwtPayload;

    if (!organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    const { items, total } = await this.organizationUserRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
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

  async create(dto: CreateOrganizationUserDto, jwtPayload: UserRequestHeader) {
    const { organizationId } = jwtPayload;

    if (!organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    const existingUser = await this.organizationUserRepository.findByUserId(
      dto.userId,
      organizationId,
    );

    if (existingUser) {
      throw new ConflictException('User sudah terdaftar');
    }

    const user = await this.organizationUserRepository.create({
      role: dto.role,
      status: dto.status,
      user: { connect: { id: dto.userId } },
      organization: { connect: { id: organizationId } },
      updatedBy: { connect: { id: jwtPayload.sub } },
    });

    return this.toResponse(user);
  }

  async update(
    id: string,
    dto: UpdateOrganizationUserDto,
    userHeader: UserRequestHeader,
  ) {
    const existingUser = await this.organizationUserRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.organizationUserRepository.update(id, {
      ...dto,
      updatedBy: { connect: { id: userHeader.sub } },
    });

    return this.toResponse(user);
  }

  async suspend(id: string, userHeader: UserRequestHeader) {
    const user = await this.organizationUserRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== OrganizationUserStatus.APPROVED) {
      throw new BadRequestException('Status user tidak valid untuk disuspensi');
    }

    const updatedUser = await this.organizationUserRepository.update(id, {
      status: OrganizationUserStatus.SUSPENDED,
      updatedBy: { connect: { id: userHeader.sub } },
    });

    return this.toResponse(updatedUser);
  }

  async activate(id: string, userHeader: UserRequestHeader) {
    const user = await this.organizationUserRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== OrganizationUserStatus.SUSPENDED) {
      throw new BadRequestException('Status user tidak valid untuk diaktifkan');
    }

    const updatedUser = await this.organizationUserRepository.update(id, {
      status: OrganizationUserStatus.APPROVED,
      updatedBy: { connect: { id: userHeader.sub } },
    });

    return this.toResponse(updatedUser);
  }

  async approve(id: string, userHeader: UserRequestHeader) {
    const user = await this.organizationUserRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== OrganizationUserStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Status user tidak valid untuk disetujui');
    }

    const updatedUser = await this.organizationUserRepository.update(id, {
      status: OrganizationUserStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: { connect: { id: userHeader.sub } },
      updatedBy: { connect: { id: userHeader.sub } },
    });

    return this.toResponse(updatedUser);
  }
}
