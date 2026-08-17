"use client";

import type { ElementType } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface CustomModalProps {
  title: string;
  description: string;
  icon: ElementType | null;
  isOpen: boolean;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function CustomModal({
  title,
  description,
  icon: Icon,
  isOpen,
  onClose,
  actionLabel,
  onAction,
}: CustomModalProps) {
  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col justify-center items-center gap-3 pb-2">
        <div
          className="flex flex-col justify-center items-center gap-3 md:flex-row"
          aria-hidden="true"
        >
          {Icon ? <Icon /> : null}
          <div className="flex flex-col justify-center items-center md:items-start">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="text-center mt-1 md:text-left">{description}</p>
          </div>
        </div>
        {actionLabel && onAction ? (
          <Button type="button" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
