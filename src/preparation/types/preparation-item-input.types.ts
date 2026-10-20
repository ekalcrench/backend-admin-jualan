import { CreatePreparationItemDto } from '../dto/create-preparation-item.dto.js';

export type PreparationItemInput = CreatePreparationItemDto & { id?: string };
