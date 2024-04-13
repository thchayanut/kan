import { createContext, useContext, useState } from "react";

type ModalContextType = {
  isOpen: boolean;
  openModal: (contentType: string) => void;
  closeModal: () => void;
  modalContentType: string;
};

interface Props {
  children: React.ReactNode;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<Props> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState("");

  const openModal = (contentType: string) => {
    setIsOpen(true);
    setModalContentType(contentType);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <ModalContext.Provider
      value={{ isOpen, openModal, closeModal, modalContentType }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
