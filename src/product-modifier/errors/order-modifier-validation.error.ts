export type OrderModifierValidationCode =
  | 'product-not-found'
  | 'product-inactive'
  | 'modifier-option-invalid'
  | 'duplicate-modifier-option'
  | 'selection-min'
  | 'selection-max';

export class OrderModifierValidationError extends Error {
  constructor(
    public readonly code: OrderModifierValidationCode,
    message: string,
  ) {
    super(message);
    this.name = 'OrderModifierValidationError';
  }
}
