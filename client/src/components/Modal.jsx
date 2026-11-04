import React from 'react';

const Modal = ({ isOpen, title, children, onClose, actionButton = null }) => {
  if (!isOpen) return null;

  return (
    <div className="animate-backdrop-fade fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="animate-modal-slide bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-light transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 text-gray-600">
          {children}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${actionButton.className || 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {actionButton.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
