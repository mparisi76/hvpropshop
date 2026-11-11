"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const DURATION = 300; // ms — matches the booking drawer

/**
 * Right-side panel that slides in on mount and slides out before `onClose` fires.
 * Render it only while open, e.g. `{open && <Drawer …/>}`, so nothing is
 * portaled during server rendering.
 *
 * `children` may be a function that receives an animated `close()` — use it for
 * buttons inside the drawer (e.g. "Done") so they slide it out too.
 */
export default function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}) {
  const [visible, setVisible] = useState(false);

  // Start off-screen, then slide in on the next frame
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  // Slide out, then unmount. (Closing twice is harmless: the panel is already hidden.)
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, DURATION);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  return createPortal(
    <div className="fixed inset-0 z-100" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <p className="text-sm font-semibold">{title}</p>
          <button
            onClick={close}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {typeof children === "function" ? children(close) : children}
        </div>
      </div>
    </div>,
    document.body
  );
}
