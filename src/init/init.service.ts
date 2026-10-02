import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../auth/dto/create-user.dto.js';
import { CreateOrganizationDto } from '../organization/dto/create-organization.dto.js';
import { OrganizationRepository } from '../organization/organization.repository.js';
import { OrganizationUserRepository } from '../organization-user/organization-user.repository.js';
import { UserService } from '../user/user.service.js';
import { CreateInitOrganizationUserDto } from './dto/create-init-organization-user.dto.js';

@Injectable()
export class InitService {
  constructor(
    private readonly userService: UserService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationUserRepository: OrganizationUserRepository,
  ) {}

  createUser(dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  createOrganization(dto: CreateOrganizationDto) {
    return this.organizationRepository.create(dto);
  }

  createOrganizationUser(dto: CreateInitOrganizationUserDto) {
    return this.organizationUserRepository.create({
      role: dto.role,
      status: dto.status,
      user: { connect: { id: dto.userId } },
      organization: { connect: { id: dto.organizationId } },
    });
  }
}
