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
    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Actions</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <p>Select one of the following actions:</p>
            <div className="d-flex flex-column gap-2">
  <button className="btn btn-danger btn-sm w-100 py-2" onClick={handleDelete}>
    <i className="bi bi-trash3 me-2"></i>
    Delete
  </button>
  <button className="btn btn-warning btn-sm w-100 py-2" onClick={handleDisable}>
    <i className="bi bi-slash-circle me-2"></i>
    Disable
  </button>
  <button className="btn btn-success btn-sm w-100 py-2" onClick={handleEnable}>
    <i className="bi bi-check-circle me-2"></i>
    Enable
  </button>
  <button className="btn btn-info btn-sm w-100 py-2" onClick={handleForceReset}>
    <i className="bi bi-arrow-clockwise me-2"></i>
    Force Password Reset
  </button>
</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsModal;