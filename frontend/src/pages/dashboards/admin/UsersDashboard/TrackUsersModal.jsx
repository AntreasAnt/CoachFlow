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
          <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="modal-header dark-modal-header" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h5 className="modal-title" style={{ color: '#fff' }}>User tracking:</h5>
              <button
  type="button"
  className="btn-close btn-close-white"
  onClick={() => {
    setshowTrackedUsersModal(false);
    setSelectedUsers([]);
  }}
  aria-label="Cancel delete"
></button>
            </div>

<div className="modal-body" style={{ backgroundColor: '#2d2d2d' }}>
  <div className="mb-4">
    <h6 className="border-bottom pb-2" style={{ color: '#fff', borderColor: 'rgba(16, 185, 129, 0.2) !important' }}>
    
      Αυτο-παρακολούθηση
    </h6>
    {selectedUser && selectedUser.trackmyself ? (
      <p style={{ color: '#fff' }}>
               <ul className="list-unstyled ms-3">
       <li  className="mb-1" style={{ color: '#fff' }}>
        <i className="bi bi-person me-2" style={{ color: '#10b981' }}></i> {selectedUser.trackmyself}
        </li>
       </ul>

      </p>
    ) : (
      <p style={{ color: '#9ca3af' }}>
        <i className="bi bi-x-circle me-2"></i>
        Δεν έχει ενεργοποιήσει την αυτο-παρακολούθηση
      </p>
    )}
  </div>

  <div>
    <h6 className="border-bottom pb-2" style={{ color: '#fff', borderColor: 'rgba(16, 185, 129, 0.2) !important' }}>
      {/* <i className="bi bi-people-fill me-2"></i> */}
      Παρακολουθεί τους υποψηφίους
    </h6>

                {selectedUser && selectedUser.trackothers ? (
                  
                  <p style={{ color: '#fff' }}>
                  <ul className="list-unstyled ms-3">
                    {selectedUser.trackothers.split(",").map((track, index) => (
                      <li key={index} className="mb-1" style={{ color: '#fff' }}>
                       
                        <i className="bi bi-person me-2" style={{ color: '#10b981' }}></i>
                        {track.trim()}
                      </li>
                    ))}
                  </ul>
                  </p>
                ) : (
                 
                  <p style={{ color: '#9ca3af' }}>
        <i className="bi bi-x-circle me-2"></i>
        Δεν παρακολουθεί κανέναν υποψήφιο
      </p>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <button
  type="button"
  className="btn"
  style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
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