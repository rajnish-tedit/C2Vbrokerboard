"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { useEscape } from "./Drawer";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  hideClose?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  hideClose,
}: ModalProps) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-navy-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-overlay",
              size === "sm"
                ? "max-w-md"
                : size === "md"
                  ? "max-w-xl"
                  : "max-w-3xl",
            )}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-navy-950">{title}</h2>
              {!hideClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </header>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
