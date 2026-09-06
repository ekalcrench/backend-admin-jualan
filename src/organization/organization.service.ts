import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FileUpload } from '../common/types/file-upload.types.js';

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

  async uploadLogo(organizationId: string, file: FileUpload) {
    // 1. Pastikan organization ada
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // 2. Buat directory
    const uploadDirectory = join(
      process.cwd(),
      'uploads',
      'organizations',
      organizationId,
    );

    if (!existsSync(uploadDirectory)) {
      mkdirSync(uploadDirectory, {
        recursive: true,
      });
    }

    // 3. Simpan file sebelum memperbarui URL di database.
    const fileName = file.originalname;
    const filePath = join(uploadDirectory, fileName);

    writeFileSync(filePath, file.buffer);

    // 4. Simpan URL relatif agar tetap valid di semua environment.
    const logoUrl = `/uploads/organizations/${organizationId}/${fileName}`;

    try {
      const updatedOrganization = await this.organizationRepository.update(
        organizationId,
        { logoUrl },
      );

      // Hapus file lama hanya setelah URL baru berhasil disimpan.
      if (organization.logoUrl && organization.logoUrl !== logoUrl) {
        const oldLogoPath = join(
          process.cwd(),
          organization.logoUrl.replace(/^[/\\]+/, ''),
        );

        if (existsSync(oldLogoPath)) {
          unlinkSync(oldLogoPath);
        }
      }

      return updatedOrganization;
    } catch (error) {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }

      throw error;
    }
  }
}
