import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { FileUpload } from '../types/file-upload.types.js';
import { extname } from 'path';

@Injectable()
export class FileImageValidationPipe implements PipeTransform {
  transform(value: FileUpload) {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    const maxSize = 1 * 1024 * 1024; // 1 MB

    if (value.size > maxSize) {
      throw new BadRequestException('Maksimal ukuran file 1MB');
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
