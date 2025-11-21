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
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Επιβεβαίωση Διαγραφής</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                aria-label="Cancel delete"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Είστε σίγουροι ότι θέλετε να διαγράψετε {selectedCount}{" "}
                {selectedCount === 1 ? "user" : "users"}?
              </p>
              <p className="text-danger">
                <small>Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</small>
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Ακύρωση
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
                aria-label="Confirm delete"
              >
                Διαγραφή
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