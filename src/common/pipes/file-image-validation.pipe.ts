import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { FileUpload } from '../types/file-upload.types.js';
import { extname } from 'path';
import { MAX_LOGO_FILE_SIZE } from '../constants/organization.constants.js';

@Injectable()
export class FileImageValidationPipe implements PipeTransform {
  constructor(private readonly required = true) {}

  transform(value: FileUpload | undefined) {
    if (!value) {
      if (this.required) {
        throw new BadRequestException('File is required');
      }

      return value;
    }

    if (value.size > MAX_LOGO_FILE_SIZE) {
      throw new BadRequestException(
        'Base64-encoded logo must not exceed 1 MiB.',
      );
    }

    if (!value.mimetype.startsWith('image/')) {
      throw new BadRequestException('File harus gambar');
    }

    const extension = extname(value.originalname).toLowerCase();

    const allowedExtensions = new Set([
      '.gif',
      '.jpeg',
      '.jpg',
      '.png',
      '.svg',
      '.webp',
    ]);

    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException('Unsupported image format');
    }

    return value;
  }
}
