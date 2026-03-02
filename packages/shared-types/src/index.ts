export type VariantKey = "en" | "ne-unicode" | "ne-preeti";

export interface VariantStatus {
  key: VariantKey;
  label: string;
  isMaster: boolean;
  isStale: boolean;
  lastSyncedAt: string | null;
}
