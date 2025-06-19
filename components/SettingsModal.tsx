import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-3 right-3 text-2xl text-textSecondary hover:text-primary"
          onClick={onClose}
          aria-label="Close settings modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default SettingsModal;
