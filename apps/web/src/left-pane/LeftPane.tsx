import { startTransition } from "react";
import type { DocumentRecord, SearchHit } from "../features/documents/model";

export type LeftPaneTab = "chapters" | "pages" | "search" | "comments" | "assets" | "data" | "versions";

interface LeftPaneProps {
  activeTab: LeftPaneTab;
  document: DocumentRecord;
  searchHits: SearchHit[];
  searchQuery: string;
  selectedBlockId: string | null;
  onJumpToPage: (pageNumber: number) => void;
  onJumpToBlock: (blockId: string) => void;
  onSearchQueryChange: (value: string) => void;
  onTabChange: (tab: LeftPaneTab) => void;
}

const tabs: Array<{ key: LeftPaneTab; label: string }> = [
  { key: "chapters", label: "Chapters" },
  { key: "pages", label: "Pages" },
  { key: "search", label: "Search" },
  { key: "comments", label: "Comments" },
  { key: "assets", label: "Assets" },
  { key: "data", label: "Data" },
  { key: "versions", label: "Versions" }
];

export const LeftPane = ({
  activeTab,
  document,
  searchHits,
  searchQuery,
  selectedBlockId,
  onJumpToPage,
  onJumpToBlock,
  onSearchQueryChange,
  onTabChange
}: LeftPaneProps) => {
  const chapters = document.pages.flatMap((page) =>
    page.blocks.filter((block) => block.kind === "heading").map((block) => ({ block, page }))
  );

  return (
    <aside className="studio-panel studio-panel--left">
      <div className="pane-tabs">
        {tabs.map((tab) => (
          <button
            className={tab.key === activeTab ? "is-active" : ""}
            key={tab.key}
            onClick={() => startTransition(() => onTabChange(tab.key))}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pane-content">
        {activeTab === "chapters" && (
          <div className="list-stack">
            {chapters.map(({ block, page }) => (
              <button
                className={block.id === selectedBlockId ? "pane-item is-selected" : "pane-item"}
                key={block.id}
                onClick={() => onJumpToBlock(block.id)}
                type="button"
              >
                <strong>{block.text}</strong>
                <span>Page {page.number}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "pages" && (
          <div className="thumbnail-stack">
            {document.pages.map((page) => (
              <button className="thumbnail-card" key={page.id} onClick={() => onJumpToPage(page.number)} type="button">
                <span className="thumbnail-card__number">{page.number}</span>
                <strong>{page.title}</strong>
                <p>{page.blocks.slice(0, 2).map((block) => block.text).join(" ")}</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === "search" && (
          <div className="search-pane">
            <label className="field">
              Search document
              <input onChange={(event) => onSearchQueryChange(event.target.value)} value={searchQuery} />
            </label>

            <div className="list-stack">
              {searchQuery && searchHits.length === 0 && <p className="empty-note">No matching blocks found.</p>}
              {searchHits.map((hit) => (
                <button className="pane-item" key={hit.blockId} onClick={() => onJumpToBlock(hit.blockId)} type="button">
                  <strong>Page {hit.pageNumber}</strong>
                  <span>{hit.snippet}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "comments" && <p className="empty-note">Comments and review threads will live here.</p>}
        {activeTab === "assets" && <p className="empty-note">Uploaded images, charts, and reusable assets will live here.</p>}
        {activeTab === "data" && <p className="empty-note">Linked tables, chart sources, and translation batches will live here.</p>}
        {activeTab === "versions" && (
          <div className="list-stack">
            <div className="pane-item">
              <strong>Current local revision</strong>
              <span>{new Date(document.updatedAt).toLocaleString()}</span>
            </div>
            <div className="pane-item">
              <strong>Master variant</strong>
              <span>{document.masterVariant}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
