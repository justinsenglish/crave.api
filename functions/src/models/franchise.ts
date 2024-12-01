export interface FranchiseSummary {
  id?: string | undefined;
  name?: string | null | undefined;
  address: FranchiseAddress;
  email?: string | null | undefined;
}

export interface FranchiseAddress {
  addressLine1?: string | null | undefined;
  addressLine2?: string | null | undefined;
  city?: string | null | undefined;
  state?: string | null | undefined;
  postalCode?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface SalesSummary {
  test: number;
  grossSales: number;
  items: number;
  serviceCharges: number;
  returns: number;
  discounts: number;
  netSales: number;
  taxes: number;
  tips: number;
  roundingAdjustments: number;
  giftCardSales: number;
  totalCollected: number;
  cash: number;
  card: number;
  giftCard: number;
  other: number;
  channelRevenue: Record<string, number>;
  externalSources: Record<string, number>;
  fees: number;
  netTotal: number;
  royalties: number;
  marketingFees: number;
}
