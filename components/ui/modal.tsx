"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = (props) => {
  const onChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader className="h-1.5">
          <DialogTitle className="sr-only">{props.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {props.description}
          </DialogDescription>
        </DialogHeader>
        <div>{props.children}</div>
      </DialogContent>
    </Dialog>
  );
};
