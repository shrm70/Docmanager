import type { DocumentBlock, DocumentRecord, VariantKey } from "../features/documents/model";
import { getBlockTextForVariant } from "../features/documents/helpers";

interface RightPaneProps {
  document: DocumentRecord;
  selectedBlock: DocumentBlock | null;
  operationMessage: string | null;
  onApplyStyle: (changes: Partial<DocumentBlock["style"]>) => void;
  onSetMasterVariant: (variant: VariantKey) => void;
  onSyncSelectedBlockVariant: (variant: VariantKey) => void;
  onSyncVariant: (variant: VariantKey) => void;
}

export const RightPane = ({
  document,
  operationMessage,
  selectedBlock,
  onApplyStyle,
  onSetMasterVariant,
  onSyncSelectedBlockVariant,
  onSyncVariant
}: RightPaneProps) => {
  return (
    <aside className="studio-panel studio-panel--right">
      <section className="property-card">
        <div className="property-card__header">
          <h2>Properties</h2>
          <span className="pill">{selectedBlock ? selectedBlock.kind : "No selection"}</span>
        </div>

        {selectedBlock ? (
          <div className="properties-stack">
            <label className="field">
              Font size
              <input
                max={42}
                min={12}
                onChange={(event) => onApplyStyle({ fontSize: Number(event.target.value) })}
                type="range"
                value={selectedBlock.style.fontSize}
              />
            </label>

            <label className="field">
              Text color
              <input onChange={(event) => onApplyStyle({ color: event.target.value })} type="color" value={selectedBlock.style.color} />
            </label>

            <label className="field">
              Gap before
              <input
                max={40}
                min={0}
                onChange={(event) => onApplyStyle({ gapBefore: Number(event.target.value) })}
                type="range"
                value={selectedBlock.style.gapBefore}
              />
            </label>

            <label className="field">
              Gap after
              <input
                max={40}
                min={0}
                onChange={(event) => onApplyStyle({ gapAfter: Number(event.target.value) })}
                type="range"
                value={selectedBlock.style.gapAfter}
              />
            </label>

            <div className="toggle-row">
              <button onClick={() => onApplyStyle({ bold: !selectedBlock.style.bold })} type="button">
                Bold
              </button>
              <button onClick={() => onApplyStyle({ italic: !selectedBlock.style.italic })} type="button">
                Italic
              </button>
            </div>
          </div>
        ) : (
          <p className="empty-note">Select a block to edit paragraph gap, font size, and text styling.</p>
        )}
      </section>

      <section className="property-card">
        <div className="property-card__header">
          <h2>Selected text sync</h2>
          <span className="pill">{selectedBlock ? document.masterVariant : "No selection"}</span>
        </div>

        {selectedBlock ? (
          <div className="variant-stack">
            {document.variants.map((variant) => (
              <div className="variant-card" key={variant.key}>
                <div>
                  <strong>{variant.label}</strong>
                  <p>{getBlockTextForVariant(selectedBlock, variant.key) || "No synced text yet."}</p>
                </div>
                <button
                  className="secondary-button"
                  disabled={variant.key === document.masterVariant}
                  onClick={() => onSyncSelectedBlockVariant(variant.key)}
                  type="button"
                >
                  {variant.key === document.masterVariant ? "Master" : "Update"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">Use these controls to convert or translate the selected block into each variant.</p>
        )}

        {operationMessage ? <p className="empty-note">{operationMessage}</p> : null}
      </section>

      <section className="property-card">
        <div className="property-card__header">
          <h2>Variants</h2>
          <span className="pill">{document.masterVariant}</span>
        </div>

        <div className="variant-stack">
          {document.variants.map((variant) => (
            <div className="variant-card" key={variant.key}>
              <div>
                <strong>{variant.label}</strong>
                <p>{variant.isStale ? "Needs sync" : "Ready"}</p>
              </div>
              <div className="variant-card__actions">
                <button className="text-button" onClick={() => onSetMasterVariant(variant.key)} type="button">
                  Make master
                </button>
                <button className="secondary-button" onClick={() => onSyncVariant(variant.key)} type="button">
                  Sync document
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};
