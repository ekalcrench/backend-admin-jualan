import type { DeliveryOrderDetails } from './delivery-order-details.types.js';
import type { DineInOrderDetails } from './dine-in-order-details.types.js';
import type { TakeawayOrderDetails } from './takeaway-order-details.types.js';

export type OrderTypeDetails = {
  deliveryOrder?: DeliveryOrderDetails;
  takeawayOrder?: TakeawayOrderDetails;
  dineInOrder?: DineInOrderDetails;
};
