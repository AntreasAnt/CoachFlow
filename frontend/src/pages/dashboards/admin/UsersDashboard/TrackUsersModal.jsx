import React from "react";

export const TrackUsersModal = ({ show, setshowTrackedUsersModal, user, setSelectedUsers }) => {
  if (!show) return null;
  console.log(user);
const selectedUser=user[0];

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
              <h5 className="modal-title">User tracking:</h5>
              <button
  type="button"
  className="btn-close"
  onClick={() => {
    setshowTrackedUsersModal(false);
    setSelectedUsers([]);
  }}
  aria-label="Cancel delete"
></button>
            </div>

<div className="modal-body">
  <div className="mb-4">
    <h6 className="border-bottom pb-2">
    
      Αυτο-παρακολούθηση
    </h6>
    {selectedUser && selectedUser.trackmyself ? (
      <p>
               <ul className="list-unstyled ms-3">
       <li  className="mb-1">
        <i className="bi bi-person me-2"></i> {selectedUser.trackmyself}
        </li>
       </ul>

      </p>
    ) : (
      <p className="text-muted">
        <i className="bi bi-x-circle me-2"></i>
        Δεν έχει ενεργοποιήσει την αυτο-παρακολούθηση
      </p>
    )}
  </div>

  <div>
    <h6 className="border-bottom pb-2">
      {/* <i className="bi bi-people-fill me-2"></i> */}
      Παρακολουθεί τους υποψηφίους
    </h6>

                {selectedUser && selectedUser.trackothers ? (
                  
                  <p>
                  <ul className="list-unstyled ms-3">
                    {selectedUser.trackothers.split(",").map((track, index) => (
                      <li key={index} className="mb-1">
                       
                        <i className="bi bi-person me-2"></i>
                        {track.trim()}
                      </li>
                    ))}
                  </ul>
                  </p>
                ) : (
                 
                  <p className="text-muted">
        <i className="bi bi-x-circle me-2"></i>
        Δεν παρακολουθεί κανέναν υποψήφιο
      </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
  type="button"
  className="btn btn-danger"
  onClick={() => {
    setshowTrackedUsersModal(false);
    setSelectedUsers([]); 
  }}
  aria-label="Confirm delete"
>
  Κλείσιμο
</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default TrackUsersModal;