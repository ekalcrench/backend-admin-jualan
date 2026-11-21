import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductModifierGroupDto } from './create-product-modifier-group.dto.js';
import { CreateProductModifierOptionDto } from './create-product-modifier-option.dto.js';
import { GetByPagesDto } from './get-by-pages.dto.js';
import { GetProductModifierGroupsDto } from './get-product-modifier-groups.dto.js';
import { ReorderProductModifierGroupsDto } from './reorder-product-modifier-groups.dto.js';
import { ReorderProductModifierOptionsDto } from './reorder-product-modifier-options.dto.js';
import { ReplaceProductModifierGroupsDto } from './replace-product-modifier-groups.dto.js';

const groupId = '33333333-3333-4333-8333-333333333333';
const optionId = '44444444-4444-4444-8444-444444444444';

const validatePayload = async <T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
) =>
  validate(plainToInstance(type, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

const messages = (errors: Awaited<ReturnType<typeof validate>>) =>
  errors.flatMap((error) => Object.values(error.constraints ?? {}));

describe('Product modifier DTO validation', () => {
  describe('CreateProductModifierGroupDto', () => {
    it('trims names before validation', async () => {
      const dto = plainToInstance(CreateProductModifierGroupDto, {
        name: '  Extra Isian  ',
      });

      expect(dto.name).toBe('Extra Isian');
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('rejects whitespace-only names', async () => {
      const errors = await validatePayload(CreateProductModifierGroupDto, {
        name: '   ',
      });

      expect(errors).not.toHaveLength(0);
    });

    it('rejects negative selection limits', async () => {
      const errors = await validatePayload(CreateProductModifierGroupDto, {
        name: 'Extra Isian',
        minSelection: -1,
        maxSelection: -1,
      });

      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['minSelection', 'maxSelection']),
      );
    });

    it('rejects non-integer selection limits', async () => {
      const errors = await validatePayload(CreateProductModifierGroupDto, {
        name: 'Extra Isian',
        minSelection: 1.5,
      });

      expect(errors.map((error) => error.property)).toContain('minSelection');
    });
  });

  describe('CreateProductModifierOptionDto', () => {
    it('rejects negative prices', async () => {
      const errors = await validatePayload(CreateProductModifierOptionDto, {
        name: 'Ayam Suwir',
        price: -1,
      });

      expect(messages(errors).join(' ')).toContain('must not be less than 0');
    });

    it('rejects prices with more than two decimal places', async () => {
      const errors = await validatePayload(CreateProductModifierOptionDto, {
        name: 'Ayam Suwir',
        price: 2500.555,
      });

      expect(errors.map((error) => error.property)).toContain('price');
    });

    it('accepts a zero additional price', async () => {
      const errors = await validatePayload(CreateProductModifierOptionDto, {
        name: 'Normal',
        price: 0,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('assignment payloads', () => {
    it('rejects duplicate modifier group ids', async () => {
      const errors = await validatePayload(ReplaceProductModifierGroupsDto, {
        modifierGroupIds: [groupId, groupId],
      });

      expect(errors.map((error) => error.property)).toContain(
        'modifierGroupIds',
      );
    });

    it('rejects non-uuid modifier group ids', async () => {
      const errors = await validatePayload(ReplaceProductModifierGroupsDto, {
        modifierGroupIds: ['not-a-uuid'],
      });

      expect(errors.map((error) => error.property)).toContain(
        'modifierGroupIds',
      );
    });

    it('allows an empty assignment list to clear a product', async () => {
      const errors = await validatePayload(ReplaceProductModifierGroupsDto, {
        modifierGroupIds: [],
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects duplicate option ids in reorder payloads', async () => {
      const errors = await validatePayload(ReorderProductModifierOptionsDto, {
        optionIds: [optionId, optionId],
      });

      expect(errors.map((error) => error.property)).toContain('optionIds');
    });

    it('rejects duplicate group ids in product reorder payloads', async () => {
      const errors = await validatePayload(ReorderProductModifierGroupsDto, {
        modifierGroupIds: [groupId, groupId],
      });

      expect(errors.map((error) => error.property)).toContain(
        'modifierGroupIds',
      );
    });
  });

  describe('query parsing', () => {
    it('parses the isActive page filter as a boolean', async () => {
      const dto = plainToInstance(GetByPagesDto, {
        page: '1',
        size: '10',
        sortBy: 'sortOrder',
        isActive: 'false',
      });

      expect(dto.isActive).toBe(false);
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('parses activeOnly as a boolean for customer ordering requests', async () => {
      const dto = plainToInstance(GetProductModifierGroupsDto, {
        activeOnly: 'true',
      });

      expect(dto.activeOnly).toBe(true);
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('rejects malformed boolean filters', async () => {
      const errors = await validatePayload(GetProductModifierGroupsDto, {
        activeOnly: 'yes',
      });

      expect(errors.map((error) => error.property)).toContain('activeOnly');
    });
  });
});
