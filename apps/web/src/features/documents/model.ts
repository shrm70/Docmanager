export type VariantKey = "en" | "ne-unicode" | "ne-preeti";
export type BlockKind =
  | "heading"
  | "paragraph"
  | "textbox"
  | "table"
  | "chart"
  | "image"
  | "flowchart";

export interface BlockStyle {
  fontSize: number;
  color: string;
  gapBefore: number;
  gapAfter: number;
  bold: boolean;
  italic: boolean;
}

export interface DocumentBlock {
  id: string;
  kind: BlockKind;
  pageId: string;
  text: string;
  level?: number;
  style: BlockStyle;
  meta?: Record<string, string | number | boolean>;
}

export interface DocumentPage {
  id: string;
  number: number;
  title: string;
  blocks: DocumentBlock[];
}

export interface VariantStatus {
  key: VariantKey;
  label: string;
  isMaster: boolean;
  isStale: boolean;
  lastSyncedAt: string | null;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  masterVariant: VariantKey;
  variants: VariantStatus[];
  pages: DocumentPage[];
}

export interface SearchHit {
  blockId: string;
  pageId: string;
  pageNumber: number;
  snippet: string;
}
