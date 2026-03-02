import type { VariantKey } from "../features/documents/model";

export type RibbonTab =
  | "File"
  | "Home"
  | "Insert"
  | "Data"
  | "Layout"
  | "References"
  | "Review"
  | "View"
  | "Nepali"
  | "Collaborate"
  | "Export";

interface RibbonProps {
  activeTab: RibbonTab;
  autosaveStatus: string;
  documentTitle: string;
  currentPage: number;
  totalPages: number;
  masterVariant: VariantKey;
  onTabChange: (tab: RibbonTab) => void;
  onCommand: (commandId: string) => void | Promise<void>;
  onJumpToPage: (pageNumber: number) => void;
}

const ribbonTabs: RibbonTab[] = [
  "File",
  "Home",
  "Insert",
  "Data",
  "Layout",
  "References",
  "Review",
  "View",
  "Nepali",
  "Collaborate",
  "Export"
];

const commandGroups: Record<RibbonTab, Array<{ label: string; commands: Array<{ id: string; label: string }> }>> = {
  File: [
    { label: "Document", commands: [{ id: "new-document", label: "New" }, { id: "download-json", label: "Download JSON" }] },
    { label: "Sync", commands: [{ id: "sync-all-variants", label: "Sync Variants" }] }
  ],
  Home: [
    {
      label: "Text",
      commands: [
        { id: "toggle-bold", label: "Bold" },
        { id: "toggle-italic", label: "Italic" },
        { id: "font-up", label: "A+" },
        { id: "font-down", label: "A-" }
      ]
    },
    {
      label: "Paragraph",
      commands: [
        { id: "gap-tight", label: "Tight Gap" },
        { id: "gap-loose", label: "Loose Gap" },
        { id: "color-slate", label: "Slate" },
        { id: "color-accent", label: "Accent" }
      ]
    }
  ],
  Insert: [
    {
      label: "Blocks",
      commands: [
        { id: "add-heading", label: "Heading" },
        { id: "add-paragraph", label: "Paragraph" },
        { id: "add-textbox", label: "Text Box" }
      ]
    },
    {
      label: "Objects",
      commands: [
        { id: "add-table", label: "Table" },
        { id: "add-chart", label: "Chart" },
        { id: "add-flowchart", label: "Flowchart" },
        { id: "add-image", label: "Image" }
      ]
    },
    { label: "Pages", commands: [{ id: "add-page", label: "New Page" }] }
  ],
  Data: [
    {
      label: "Data Objects",
      commands: [
        { id: "add-chart", label: "Linked Chart" },
        { id: "add-table", label: "Data Table" },
        { id: "add-textbox", label: "KPI Text Box" }
      ]
    }
  ],
  Layout: [
    {
      label: "View",
      commands: [
        { id: "gap-tight", label: "Compact" },
        { id: "gap-loose", label: "Spacious" },
        { id: "add-page", label: "Section Page" }
      ]
    }
  ],
  References: [
    {
      label: "Structure",
      commands: [
        { id: "add-heading", label: "Heading" },
        { id: "add-textbox", label: "Callout" }
      ]
    }
  ],
  Review: [
    {
      label: "Workflow",
      commands: [
        { id: "sync-all-variants", label: "Mark Reviewed" },
        { id: "download-json", label: "Snapshot" }
      ]
    }
  ],
  View: [
    {
      label: "Panels",
      commands: [
        { id: "show-pages", label: "Pages" },
        { id: "show-search", label: "Search" },
        { id: "show-chapters", label: "Chapters" }
      ]
    }
  ],
  Nepali: [
    {
      label: "Variants",
      commands: [
        { id: "set-master-unicode", label: "Master Unicode" },
        { id: "set-master-preeti", label: "Master Preeti" },
        { id: "set-master-english", label: "Master English" },
        { id: "sync-preeti", label: "Sync Preeti" }
      ]
    },
    {
      label: "Selection",
      commands: [
        { id: "sync-selected-unicode", label: "Selection -> Unicode" },
        { id: "sync-selected-preeti", label: "Selection -> Preeti" },
        { id: "translate-selected-english", label: "Selection -> English" }
      ]
    }
  ],
  Collaborate: [{ label: "Sharing", commands: [{ id: "sync-all-variants", label: "Prepare Share Copy" }] }],
  Export: [
    {
      label: "Download",
      commands: [
        { id: "download-json", label: "JSON" },
        { id: "sync-all-variants", label: "Refresh Exports" }
      ]
    }
  ]
};

export const Ribbon = ({
  activeTab,
  autosaveStatus,
  documentTitle,
  currentPage,
  totalPages,
  masterVariant,
  onTabChange,
  onCommand,
  onJumpToPage
}: RibbonProps) => {
  return (
    <header className="ribbon">
      <div className="ribbon__row ribbon__row--top">
        <div className="quick-actions">
          <button onClick={() => void onCommand("new-document")} type="button">
            New
          </button>
          <button onClick={() => void onCommand("download-json")} type="button">
            Save
          </button>
          <button onClick={() => void onCommand("sync-all-variants")} type="button">
            Sync
          </button>
        </div>

        <div className="ribbon-tabs" role="tablist">
          {ribbonTabs.map((tab) => (
            <button
              className={tab === activeTab ? "is-active" : ""}
              key={tab}
              onClick={() => onTabChange(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="document-status">
          <div>
            <strong>{documentTitle}</strong>
            <span>Master: {masterVariant}</span>
          </div>
          <span className="pill">{autosaveStatus}</span>
        </div>
      </div>

      <div className="ribbon__row ribbon__row--commands">
        <div className="command-strip">
          {commandGroups[activeTab].map((group) => (
            <section className="command-group" key={group.label}>
              <div className="command-group__buttons">
                {group.commands.map((command) => (
                  <button key={command.id} onClick={() => void onCommand(command.id)} type="button">
                    {command.label}
                  </button>
                ))}
              </div>
              <span>{group.label}</span>
            </section>
          ))}
        </div>

        <label className="page-jump">
          Page
          <input
            defaultValue={currentPage}
            max={totalPages}
            min={1}
            onBlur={(event) => onJumpToPage(Number(event.target.value))}
            type="number"
          />
          <span>/ {totalPages}</span>
        </label>
      </div>
    </header>
  );
};
