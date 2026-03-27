"use client";

import { useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLoading?: boolean;
};

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  confirmLoading = false,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    // Focus confirm button when modal opens
    setTimeout(() => confirmRef.current?.focus(), 60);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(2,6,23,0.55)",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: 520,
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 20px 50px rgba(2,6,23,0.35)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 id="confirm-title" style={{ margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <X />
          </button>
        </div>

        <div style={{ color: "#475569", marginBottom: 18 }}>{message}</div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 12px", borderRadius: 8 }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={confirmLoading}
            style={{
              padding: "8px 14px",
              background: "#ef4444",
              color: "white",
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {confirmLoading ? <Loader2 className="spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
