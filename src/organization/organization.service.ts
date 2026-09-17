import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { FileUpload } from '../common/types/file-upload.types.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';

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

  async create(dto: CreateOrganizationDto, file: FileUpload) {
    const organizationId = randomUUID();
    const uploadDirectory = join(
      process.cwd(),
      'uploads',
      'organizations',
      organizationId,
    );
    const fileName = file.originalname;
    const filePath = join(uploadDirectory, fileName);
    const logoUrl = `/uploads/organizations/${organizationId}/${fileName}`;

    mkdirSync(uploadDirectory, { recursive: true });
    writeFileSync(filePath, file.buffer);

    try {
      return await this.organizationRepository.create({
        ...dto,
        id: organizationId,
        logoUrl,
      });
    } catch (error) {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateOrganizationDto, file?: FileUpload) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    let filePath: string | undefined;
    let logoUrl: string | undefined;

    if (file) {
      const uploadDirectory = join(
        process.cwd(),
        'uploads',
        'organizations',
        id,
      );
      const fileName = file.originalname;
      filePath = join(uploadDirectory, fileName);
      logoUrl = `/uploads/organizations/${id}/${fileName}`;

      mkdirSync(uploadDirectory, { recursive: true });
      writeFileSync(filePath, file.buffer);
    }

    try {
      const org = await this.organizationRepository.update(id, {
        ...dto,
        ...(logoUrl && { logoUrl }),
      });

      // DB berhasil → hapus logo lama
      if (file && existing.logoUrl) {
        const oldFilePath = join(process.cwd(), existing.logoUrl);

        if (existsSync(oldFilePath)) {
          unlinkSync(oldFilePath);
        }
      }

      return org;
    } catch (error) {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }

      throw error;
    }
  }

  async delete(id: string) {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    await this.organizationRepository.delete(id);

    return true;
  }
}
