export const ORDER_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
