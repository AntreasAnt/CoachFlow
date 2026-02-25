import React from "react";

export const DeleteModal = ({ show, selectedCount, onCancel, onConfirm }) => {
  if (!show) return null;

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        style={{ display: show ? "block" : "none" }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="modal-header dark-modal-header" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h5 className="modal-title" style={{ color: '#fff' }}>Confirm Delete</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onCancel}
                aria-label="Cancel delete"
              ></button>
            </div>
            <div className="modal-body" style={{ backgroundColor: '#2d2d2d' }}>
              <p style={{ color: '#fff' }}>
                Are you sure you want to delete {selectedCount}{" "}
                {selectedCount === 1 ? "user" : "users"}?
              </p>
              <p style={{ color: '#ef4444' }}>
                <small>This action cannot be undone.</small>
              </p>
            </div>
            <div className="modal-footer" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <button type="button" className="btn" style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }} onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                onClick={onConfirm}
                aria-label="Confirm delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default DeleteModal;