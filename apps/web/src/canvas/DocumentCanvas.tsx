import type { MutableRefObject } from "react";
import type { DocumentBlock, DocumentRecord } from "../features/documents/model";

interface DocumentCanvasProps {
  document: DocumentRecord;
  pageRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlockText: (blockId: string, text: string) => void;
}

const renderPlaceholderLabel = (block: DocumentBlock) => {
  switch (block.kind) {
    case "table":
      return "Table area";
    case "chart":
      return "Chart area";
    case "image":
      return "Image area";
    case "flowchart":
      return "Flowchart area";
    case "textbox":
      return "Text box";
    default:
      return "Content";
  }
};

export const DocumentCanvas = ({
  document,
  pageRefs,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlockText
}: DocumentCanvasProps) => {
  return (
    <section className="canvas-area">
      {document.pages.map((page) => (
        <article
          className="document-page"
          data-page-id={page.id}
          key={page.id}
          ref={(node) => {
            pageRefs.current[page.id] = node;
          }}
        >
          <header className="document-page__header">
            <span>{page.title}</span>
            <strong>Page {page.number}</strong>
          </header>

          <div className="document-page__content">
            {page.blocks.map((block) => (
              <div
                className={block.id === selectedBlockId ? "document-block is-selected" : "document-block"}
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                style={{
                  marginTop: `${block.style.gapBefore}px`,
                  marginBottom: `${block.style.gapAfter}px`
                }}
              >
                {(block.kind === "heading" || block.kind === "paragraph") && (
                  <textarea
                    className={`document-text document-text--${block.kind}`}
                    onChange={(event) => onUpdateBlockText(block.id, event.target.value)}
                    style={{
                      color: block.style.color,
                      fontSize: `${block.style.fontSize}px`,
                      fontStyle: block.style.italic ? "italic" : "normal",
                      fontWeight: block.style.bold ? 700 : 400
                    }}
                    value={block.text}
                  />
                )}

                {block.kind !== "heading" && block.kind !== "paragraph" && (
                  <div className={`object-placeholder object-placeholder--${block.kind}`}>
                    <span>{renderPlaceholderLabel(block)}</span>
                    <textarea
                      className="document-text document-text--object"
                      onChange={(event) => onUpdateBlockText(block.id, event.target.value)}
                      value={block.text}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
};
