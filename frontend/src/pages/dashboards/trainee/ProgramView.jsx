import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TraineeDashboard from '../../../components/TraineeDashboard';

const ProgramView = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isTrainerAssigned, setIsTrainerAssigned] = useState(false);

  useEffect(() => {
    // Check if this is a trainer-assigned program from navigation state
    if (location.state?.fromAssigned) {
      setIsTrainerAssigned(true);
    }
    fetchProgramDetails();
  }, [programId, location.state]);

  const fetchProgramDetails = async () => {
    try {
      console.log('Fetching program details for ID:', programId);
      setLoading(true);
      
      let data;
      let usedCustomEndpoint = false;
      try {
        // First try the custom program details endpoint (for trainer-created programs)
        data = await APIClient.get(`${BACKEND_ROUTES_API}GetCustomProgramDetails.php?programId=${programId}`);
        usedCustomEndpoint = true;
        // If we successfully used custom endpoint, it's likely trainer-assigned
        setIsTrainerAssigned(true);
      } catch (error) {
        console.log('Custom program details failed, trying standard endpoint:', error);
        // If that fails, try the standard program details endpoint (for marketplace programs)
        data = await APIClient.get(`${BACKEND_ROUTES_API}GetProgramDetails.php?programId=${programId}`);
        // Standard endpoint suggests it's a purchased program
        if (!location.state?.fromAssigned) {
          setIsTrainerAssigned(false);
        }
      }
      
      console.log('Program details response:', data);
      
      if (data.success) {
        setProgram(data.program);
        // Additional check: if program has created_by_trainer_id, it might be trainer-assigned
        if (data.program.created_by_trainer_id && !usedCustomEndpoint) {
          setIsTrainerAssigned(true);
        }
      } else {
        throw new Error(data.message || 'Failed to load program details');
      }
    } catch (err) {
      console.error('Error fetching program details:', err);
      setError(err.message || 'Failed to load program details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startSession = (session) => {
    console.log('Starting session:', session);
    
    // Navigate to workout session with the session data
    navigate('/trainee-dashboard/workouts', {
      state: {
        startWorkout: true,
        workoutData: {
          id: `program_${programId}_session_${session.id}`,
          name: session.session_name || session.name,
          description: session.session_description || session.description || '',
          programId: programId,
          programTitle: program.title,
          sessionId: session.id,
          exercises: session.exercises.map(ex => ({
            id: ex.exercise_id,
            name: ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '10',
            rest: parseInt(ex.rest_seconds) || 60,
            notes: ex.notes || '',
            order_index: ex.order_index
          })),
          startTime: new Date(),
          completedSets: session.exercises.map(ex => Array(parseInt(ex.sets) || 3).fill({
            weight: 0,
            reps: 0,
            rpe: 0,
            notes: '',
            completed: false
          }))
        }
      }
    });
  };

  const mainContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading program details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => navigate('/trainee-dashboard/workouts')}
          >
            Back to My Workouts
          </button>
        </div>
      );
    }

    if (!program) {
      return (
        <div className="alert alert-warning">
          <i className="bi bi-info-circle me-2"></i>
          Program not found.
          <button 
            className="btn btn-sm btn-outline-warning ms-3"
            onClick={() => navigate('/trainee-dashboard/workouts')}
          >
            Back to My Workouts
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={() => navigate('/trainee-dashboard/workouts')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="flex-grow-1">
            <h2 className="mb-1">{program.title}</h2>
            <p className="text-muted mb-0">By {program.trainer_name}</p>
          </div>
          {isTrainerAssigned ? (
            <span className="badge bg-primary fs-6">
              <i className="bi bi-person-check me-1"></i>
              Trainer Assigned
            </span>
          ) : (
            <span className="badge bg-success fs-6">
              <i className="bi bi-bag-check me-1"></i>
              Purchased
            </span>
          )}
        </div>

        {/* Program Info */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h5>About This Program</h5>
                <p className="text-muted">{program.description}</p>
                {program.long_description && (
                  <div className="mt-3">
                    <p>{program.long_description}</p>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="d-flex flex-column gap-2">
                  <div>
                    <small className="text-muted">Category</small>
                    <div><span className="badge bg-primary">{program.category}</span></div>
                  </div>
                  <div>
                    <small className="text-muted">Difficulty</small>
                    <div><span className="badge bg-light text-dark">{program.difficulty_level}</span></div>
                  </div>
                  <div>
                    <small className="text-muted">Duration</small>
                    <div><span className="badge bg-light text-dark">{program.duration_weeks} weeks</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-4">
          <h4 className="mb-3">
            <i className="bi bi-calendar-week me-2"></i>
            Workout Sessions ({program.sessions?.length || 0})
          </h4>
          
          {program.sessions && program.sessions.length > 0 ? (
            <div className="row">
              {program.sessions.map((session, index) => (
                <div key={session.id} className="col-lg-6 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="badge bg-light text-dark mb-2">Session {index + 1}</span>
                          <h5 className="card-title mb-1">{session.session_name || session.name}</h5>
                          {(session.session_description || session.description) && (
                            <p className="text-muted small mb-0">{session.session_description || session.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted fw-bold">Exercises:</small>
                        <ul className="list-unstyled mt-2 mb-0">
                          {session.exercises?.slice(0, 3).map((ex, idx) => (
                            <li key={idx} className="small text-muted">
                              <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.3rem' }}></i>
                              {ex.name} - {ex.sets} sets x {ex.reps} reps
                            </li>
                          ))}
                          {session.exercises?.length > 3 && (
                            <li className="small text-muted">
                              <i className="bi bi-three-dots me-2"></i>
                              +{session.exercises.length - 3} more exercises
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-primary flex-fill"
                          onClick={() => startSession(session)}
                        >
                          <i className="bi bi-play-circle me-2"></i>
                          Start Session
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => setSelectedSession(session)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No sessions available for this program yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TraineeDashboard>
      <div className="container-fluid">
        {mainContent()}

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedSession.session_name || selectedSession.name}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedSession(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  {(selectedSession.session_description || selectedSession.description) && (
                    <div className="mb-3">
                      <p className="text-muted">{selectedSession.session_description || selectedSession.description}</p>
                    </div>
                  )}

                  <h6 className="mb-3">Exercises ({selectedSession.exercises?.length || 0})</h6>
                  
                  {selectedSession.exercises?.map((ex, idx) => (
                    <div key={idx} className="card border-0 bg-light mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{idx + 1}. {ex.name}</h6>
                            <div className="small text-muted">
                              <span className="me-3">
                                <i className="bi bi-layers me-1"></i>
                                {ex.sets} sets
                              </span>
                              <span className="me-3">
                                <i className="bi bi-repeat me-1"></i>
                                {ex.reps} reps
                              </span>
                              {ex.rest_seconds && (
                                <span>
                                  <i className="bi bi-clock me-1"></i>
                                  {ex.rest_seconds}s rest
                                </span>
                              )}
                            </div>
                            {ex.notes && (
                              <p className="small text-muted mb-0 mt-2">
                                <i className="bi bi-info-circle me-1"></i>
                                {ex.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedSession(null)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedSession(null);
                      startSession(selectedSession);
                    }}
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Start Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default ProgramView;
