import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { randomUUID } from 'crypto';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { MAX_LOGO_BASE64_SIZE } from '../common/constants/organization.constants.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async findByPages(dto: GetByPagesDto) {
    const { items, total } = await this.organizationRepository.findByPages(dto);

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
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async create(dto: CreateOrganizationDto) {
    const organizationId = randomUUID();
    const logoBase64 = this.validateLogoBase64(dto.logoBase64);

    if (!logoBase64) {
      throw new BadRequestException('logoBase64 is required.');
    }

    return this.organizationRepository.create({
      ...dto,
      id: organizationId,
      logoBase64,
    });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const logoBase64 = this.validateLogoBase64(dto.logoBase64);

    return this.organizationRepository.update(id, {
      ...dto,
      ...(logoBase64 !== undefined && { logoBase64 }),
    });
  }

  async delete(id: string) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    await this.organizationRepository.delete(id);

    return true;
  }

  private validateLogoBase64(logoBase64: string | undefined) {
    if (
      logoBase64 !== undefined &&
      Buffer.byteLength(logoBase64, 'utf8') > MAX_LOGO_BASE64_SIZE
    ) {
      throw new BadRequestException(
        'Base64-encoded logo must not exceed 2 MiB.',
      );
    }

    return logoBase64;
  }
}
