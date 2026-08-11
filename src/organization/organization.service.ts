import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async findAll() {
    const orgs = await this.organizationRepository.findAll();
    return orgs.map((org) => org);
  }

  async findById(id: string) {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async create(dto: CreateOrganizationDto) {
    const org = await this.organizationRepository.create(dto);
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const org = await this.organizationRepository.update(id, dto);
    return org;
  }

  async delete(id: string) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    await this.organizationRepository.delete(id);

    return { message: 'Organization deleted successfully' };
  }
}
