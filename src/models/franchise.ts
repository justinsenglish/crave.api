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

export interface Royalties {
    grossSales: number;
    royalties: number;
}
