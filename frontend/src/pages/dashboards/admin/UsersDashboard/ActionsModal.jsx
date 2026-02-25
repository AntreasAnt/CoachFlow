import React from "react";

const ActionsModal = ({
  show,
  handleClose,
  handleDelete,
  handleDisable,
  handleForceReset,
  handleEnable,
}) => {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div className="modal-header dark-modal-header" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h5 className="modal-title" style={{ color: '#fff' }}>Actions</h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
          </div>
          <div className="modal-body" style={{ backgroundColor: '#2d2d2d' }}>
            <p style={{ color: '#fff' }}>Select one of the following actions:</p>
            <div className="d-flex flex-column gap-2">
  <button className="btn btn-sm w-100 py-2" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} onClick={handleDelete}>
    <i className="bi bi-trash3 me-2"></i>
    Delete
  </button>
  <button className="btn btn-sm w-100 py-2" style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }} onClick={handleDisable}>
    <i className="bi bi-slash-circle me-2"></i>
    Disable
  </button>
  <button className="btn btn-sm w-100 py-2" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} onClick={handleEnable}>
    <i className="bi bi-check-circle me-2"></i>
    Enable
  </button>
  <button className="btn btn-sm w-100 py-2" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} onClick={handleForceReset}>
    <i className="bi bi-arrow-clockwise me-2"></i>
    Force Password Reset
  </button>
</div>
          </div>
          <div className="modal-footer" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }} onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsModal;