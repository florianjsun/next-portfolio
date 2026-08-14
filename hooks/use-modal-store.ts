import { ElementType } from "react";
import { create } from "zustand";

interface ModalDataProps {
  title: string;
  description: string;
  icon: ElementType;
}

interface ModalStoreProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon: ElementType | null;
  onOpen: (data: ModalDataProps) => void;
  onClose: () => void;
}

export const useModalStore = create<ModalStoreProps>((set) => ({
  isOpen: false,
  title: "",
  description: "",
  icon: null,
  onOpen: (data: ModalDataProps) =>
    set({
      isOpen: true,
      title: data.title,
      description: data.description,
      icon: data.icon,
    }),
  onClose: () => set({ isOpen: false }),
}));
