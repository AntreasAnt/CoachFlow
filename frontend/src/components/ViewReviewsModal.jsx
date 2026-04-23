import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../config/config';
import APIClient from '../utils/APIClient';

const ViewReviewsModal = ({ show, onHide, trainerId, trainerName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  useEffect(() => {
    if (show && trainerId) {
      setPage(1);
      fetchReviews(1);
    }
  }, [show, trainerId]);

  const fetchReviews = async (pageNumber) => {
    try {
      setLoading(true);
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetReviews.php?user_id=${trainerId}&include_reviewer_info=true&page=${pageNumber}&limit=${limit}`);
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.pagination) setTotalPages(data.pagination.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating) => {
    return (
      <span style={{ color: '#ffc107', fontSize: '0.9rem' }}>
        {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      </span>
    );
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={{ background: '#0f140f', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem', color: '#fff' }}>
          <div className="modal-header border-0 pb-0" style={{ background: 'transparent' }}>
            <h5 className="modal-title text-white">Reviews for {trainerName && !trainerName.includes('undefined') ? trainerName : 'Trainer'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" style={{ color: 'var(--brand-primary)' }}></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-4 opacity-75">No reviews yet</div>
            ) : (
              <div>
                {reviews.map((r, i) => (
                  <div key={i} className="mb-3 p-3 rounded" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.1)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-white">{r.reviewer_name || r.reviewer_username || 'Anonymous'}</strong>
                      {getRatingStars(r.rating)}
                    </div>
                    <small className="opacity-75 d-block mb-2">{new Date(r.updated_at || r.created_at).toLocaleDateString()}</small>
                    <p className="mb-0 small">{r.review_text}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <button 
                  className="btn btn-sm" 
                  style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'white', border: '1px solid rgba(32, 214, 87, 0.3)' }}
                  disabled={page <= 1}
                  onClick={() => { setPage(page-1); fetchReviews(page-1); }}
                >
                  <i className="bi bi-chevron-left me-1"></i> Prev
                </button>
                <span className="small opacity-75">Page {page} of {totalPages}</span>
                <button 
                  className="btn btn-sm" 
                  style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'white', border: '1px solid rgba(32, 214, 87, 0.3)' }}
                  disabled={page >= totalPages}
                  onClick={() => { setPage(page+1); fetchReviews(page+1); }}
                >
                  Next <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReviewsModal;
