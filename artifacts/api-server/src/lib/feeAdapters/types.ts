export type FeeResult = {
  scope: "all_programs";
  academic_year: string;
  domestic_fee: number | null;
  international_fee: number | null;
  currency: "USD" | "EUR" | "TRY";
  source_url: string;
};

export interface UniversityFeeAdapter {
  id: string;
  matchName: string;
  fetchFee(): Promise<FeeResult | null>;
}
