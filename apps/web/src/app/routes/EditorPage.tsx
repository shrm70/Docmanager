import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DocumentCanvas } from "../../canvas/DocumentCanvas";
import type { DocumentBlock, DocumentRecord, SearchHit, VariantKey } from "../../features/documents/model";
import { downloadDocument } from "../../features/documents/storage";
import { LeftPane, type LeftPaneTab } from "../../left-pane/LeftPane";
import { Ribbon, type RibbonTab } from "../../ribbon/Ribbon";
import { RightPane } from "../../right-pane/RightPane";
import { useDocumentStore } from "../providers/DocumentStoreProvider";

const cloneDocument = (document: DocumentRecord): DocumentRecord => ({
  ...document,
  variants: document.variants.map((variant) => ({ ...variant })),
  pages: document.pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => ({
      ...block,
      style: { ...block.style },
      meta: block.meta ? { ...block.meta } : undefined
    }))
  }))
});

const markVariantsStale = (document: DocumentRecord): DocumentRecord => ({
  ...document,
  updatedAt: new Date().toISOString(),
  variants: document.variants.map((variant) =>
    variant.key === document.masterVariant
      ? { ...variant, isMaster: true, isStale: false, lastSyncedAt: new Date().toISOString() }
      : { ...variant, isMaster: false, isStale: true }
  )
});

const markVariantsFresh = (document: DocumentRecord, target?: VariantKey): DocumentRecord => {
  const now = new Date().toISOString();

  return {
    ...document,
    variants: document.variants.map((variant) => {
      if (target && variant.key !== target) {
        return variant;
      }

      return {
        ...variant,
        isStale: false,
        lastSyncedAt: now
      };
    })
  };
};

const locateBlock = (document: DocumentRecord, blockId: string | null) => {
  for (const page of document.pages) {
    for (const block of page.blocks) {
      if (block.id === blockId) {
        return { page, block };
      }
    }
  }

  return null;
};

const createObjectBlock = (
  pageId: string,
  kind: DocumentBlock["kind"],
  text: string,
  styleOverrides: Partial<DocumentBlock["style"]> = {}
): DocumentBlock => ({
  id: `block-${crypto.randomUUID()}`,
  kind,
  pageId,
  text,
  style: {
    fontSize: kind === "heading" ? 28 : 16,
    color: "#2a2a2a",
    gapBefore: 8,
    gapAfter: 12,
    bold: kind === "heading",
    italic: false,
    ...styleOverrides
  }
});

interface EditorWorkspaceProps {
  sourceDocument: DocumentRecord;
}

const EditorWorkspace = ({ sourceDocument }: EditorWorkspaceProps) => {
  const navigate = useNavigate();
  const { createDocument, saveDocument, setMasterVariant, syncDocumentVariants } = useDocumentStore();
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>("Home");
  const [activeLeftPaneTab, setActiveLeftPaneTab] = useState<LeftPaneTab>("chapters");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [autosaveStatus, setAutosaveStatus] = useState("Saved");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(sourceDocument.pages[0]?.blocks[0]?.id ?? null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const pageRefs = useRef<Record<string, HTMLElement | null>>({});
  const [workingDocument, setWorkingDocument] = useState<DocumentRecord>(() => cloneDocument(sourceDocument));

  useEffect(() => {
    if (!hasPendingSave) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveDocument(workingDocument);
      setHasPendingSave(false);
      setAutosaveStatus("Saved");
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [hasPendingSave, saveDocument, workingDocument]);

  const selectedLocation = useMemo(() => locateBlock(workingDocument, selectedBlockId), [selectedBlockId, workingDocument]);
  const selectedBlock = selectedLocation?.block ?? null;

  const searchHits = useMemo<SearchHit[]>(() => {
    if (!deferredSearchQuery.trim()) {
      return [];
    }

    const query = deferredSearchQuery.toLowerCase();
    return workingDocument.pages.flatMap((page) =>
      page.blocks
        .filter((block) => block.text.toLowerCase().includes(query))
        .map((block) => ({
          blockId: block.id,
          pageId: page.id,
          pageNumber: page.number,
          snippet: block.text.slice(0, 120)
        }))
    );
  }, [deferredSearchQuery, workingDocument]);

  const updateDocument = (updater: (document: DocumentRecord) => DocumentRecord) => {
    setWorkingDocument((current) => markVariantsStale(updater(current)));
    setHasPendingSave(true);
    setAutosaveStatus("Unsaved changes");
  };

  const syncVariantLocal = (variant?: VariantKey) => {
    setWorkingDocument((current) => markVariantsFresh(current, variant));
  };

  const jumpToPage = (pageNumber: number) => {
    const page = workingDocument.pages.find((item) => item.number === pageNumber);

    if (!page) {
      return;
    }

    setCurrentPageNumber(page.number);
    pageRefs.current[page.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToBlock = (blockId: string) => {
    const location = locateBlock(workingDocument, blockId);

    if (!location) {
      return;
    }

    setSelectedBlockId(blockId);
    jumpToPage(location.page.number);
  };

  const updateBlockText = (blockId: string, text: string) => {
    updateDocument((document) => ({
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => (block.id === blockId ? { ...block, text } : block))
      }))
    }));
  };

  const applyStyle = (changes: Partial<DocumentBlock["style"]>) => {
    if (!selectedBlock) {
      return;
    }

    updateDocument((document) => ({
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) =>
          block.id === selectedBlock.id
            ? {
                ...block,
                style: {
                  ...block.style,
                  ...changes
                }
              }
            : block
        )
      }))
    }));
  };

  const addBlock = (kind: DocumentBlock["kind"]) => {
    const pageId = selectedLocation?.page.id ?? workingDocument.pages[workingDocument.pages.length - 1].id;
    const textMap: Record<DocumentBlock["kind"], string> = {
      heading: "New heading",
      paragraph: "New paragraph",
      textbox: "Textbox placeholder",
      table: "Table placeholder for structured data",
      chart: "Chart placeholder for linked data",
      image: "Image placeholder",
      flowchart: "Flowchart placeholder"
    };

    const newBlock = createObjectBlock(pageId, kind, textMap[kind]);
    updateDocument((document) => ({
      ...document,
      pages: document.pages.map((page) =>
        page.id === pageId ? { ...page, blocks: [...page.blocks, newBlock] } : page
      )
    }));
    setSelectedBlockId(newBlock.id);
  };

  const addPage = () => {
    const pageNumber = workingDocument.pages.length + 1;
    const pageId = `page-${crypto.randomUUID()}`;

    updateDocument((document) => ({
      ...document,
      pages: [
        ...document.pages,
        {
          id: pageId,
          number: pageNumber,
          title: `Page ${pageNumber}`,
          blocks: [createObjectBlock(pageId, "heading", "New page heading")]
        }
      ]
    }));
    setCurrentPageNumber(pageNumber);
  };

  const handleSetMasterVariant = (variant: VariantKey) => {
    setMasterVariant(workingDocument.id, variant);
    setWorkingDocument((current) => ({
      ...current,
      masterVariant: variant,
      updatedAt: new Date().toISOString(),
      variants: current.variants.map((item) => ({
        ...item,
        isMaster: item.key === variant,
        isStale: item.key !== variant
      }))
    }));
    setAutosaveStatus("Saved");
    setHasPendingSave(false);
  };

  const handleCommand = (commandId: string) => {
    switch (commandId) {
      case "toggle-bold":
        applyStyle({ bold: !selectedBlock?.style.bold });
        return;
      case "toggle-italic":
        applyStyle({ italic: !selectedBlock?.style.italic });
        return;
      case "font-up":
        applyStyle({ fontSize: Math.min(42, (selectedBlock?.style.fontSize ?? 16) + 2) });
        return;
      case "font-down":
        applyStyle({ fontSize: Math.max(12, (selectedBlock?.style.fontSize ?? 16) - 2) });
        return;
      case "gap-tight":
        applyStyle({ gapBefore: 4, gapAfter: 8 });
        return;
      case "gap-loose":
        applyStyle({ gapBefore: 16, gapAfter: 24 });
        return;
      case "color-slate":
        applyStyle({ color: "#2f4858" });
        return;
      case "color-accent":
        applyStyle({ color: "#1f6feb" });
        return;
      case "add-heading":
        addBlock("heading");
        return;
      case "add-paragraph":
        addBlock("paragraph");
        return;
      case "add-textbox":
        addBlock("textbox");
        return;
      case "add-table":
        addBlock("table");
        return;
      case "add-chart":
        addBlock("chart");
        return;
      case "add-image":
        addBlock("image");
        return;
      case "add-flowchart":
        addBlock("flowchart");
        return;
      case "add-page":
        addPage();
        return;
      case "new-document": {
        const document = createDocument();
        navigate(`/editor/${document.id}`);
        return;
      }
      case "download-json":
        downloadDocument(workingDocument);
        return;
      case "sync-all-variants":
        syncDocumentVariants(workingDocument.id);
        syncVariantLocal();
        return;
      case "sync-preeti":
        syncDocumentVariants(workingDocument.id, "ne-preeti");
        syncVariantLocal("ne-preeti");
        return;
      case "set-master-unicode":
        handleSetMasterVariant("ne-unicode");
        return;
      case "set-master-preeti":
        handleSetMasterVariant("ne-preeti");
        return;
      case "show-pages":
        setActiveLeftPaneTab("pages");
        return;
      case "show-search":
        setActiveLeftPaneTab("search");
        return;
      case "show-chapters":
        setActiveLeftPaneTab("chapters");
        return;
      default:
        return;
    }
  };

  return (
    <main className="editor-shell">
      <Ribbon
        activeTab={activeRibbonTab}
        autosaveStatus={autosaveStatus}
        currentPage={currentPageNumber}
        documentTitle={workingDocument.title}
        masterVariant={workingDocument.masterVariant}
        onCommand={handleCommand}
        onJumpToPage={jumpToPage}
        onTabChange={setActiveRibbonTab}
        totalPages={workingDocument.pages.length}
      />

      <div className="editor-shell__body">
        <LeftPane
          activeTab={activeLeftPaneTab}
          document={workingDocument}
          onJumpToBlock={jumpToBlock}
          onJumpToPage={jumpToPage}
          onSearchQueryChange={setSearchQuery}
          onTabChange={setActiveLeftPaneTab}
          searchHits={searchHits}
          searchQuery={searchQuery}
          selectedBlockId={selectedBlockId}
        />

        <div className="studio-workspace">
          <div className="workspace-topbar">
            <div>
              <Link className="text-link" to="/gallery">
                Gallery
              </Link>
              <Link className="text-link" to="/admin">
                Admin Sync
              </Link>
            </div>
            <span>
              {workingDocument.pages.length} pages | Updated {new Date(workingDocument.updatedAt).toLocaleTimeString()}
            </span>
          </div>

          <DocumentCanvas
            document={workingDocument}
            onSelectBlock={setSelectedBlockId}
            onUpdateBlockText={updateBlockText}
            pageRefs={pageRefs}
            selectedBlockId={selectedBlockId}
          />

          <footer className="editor-footer">
            <span>Search results: {searchHits.length}</span>
            <span>Autosave: {autosaveStatus}</span>
            <span>Base path: /Docmanager/</span>
          </footer>
        </div>

        <RightPane
          document={workingDocument}
          onApplyStyle={applyStyle}
          onSetMasterVariant={handleSetMasterVariant}
          onSyncVariant={(variant) => {
            syncDocumentVariants(workingDocument.id, variant);
            syncVariantLocal(variant);
          }}
          selectedBlock={selectedBlock}
        />
      </div>
    </main>
  );
};

export const EditorPage = () => {
  const { documentId = "" } = useParams();
  const { getDocument } = useDocumentStore();
  const sourceDocument = getDocument(documentId);

  if (!sourceDocument) {
    return (
      <main className="marketing-shell">
        <section className="page-header">
          <div>
            <p className="eyebrow">Editor</p>
            <h1>Document not found</h1>
          </div>
          <Link className="primary-button" to="/gallery">
            Back to Gallery
          </Link>
        </section>
      </main>
    );
  }

  return <EditorWorkspace key={sourceDocument.id} sourceDocument={sourceDocument} />;
};
