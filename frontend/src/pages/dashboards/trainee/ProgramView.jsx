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
  const [completedSessions, setCompletedSessions] = useState(new Set());
  const [sessionCompletionCounts, setSessionCompletionCounts] = useState({});
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const toggleSession = (id) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };


  useEffect(() => {
    // Check if this is a trainer-assigned program from navigation state
    if (location.state?.fromAssigned) {
      setIsTrainerAssigned(true);
    }
    fetchProgramDetails();
    fetchWorkoutHistory();
  }, [programId, location.state]);

  const fetchWorkoutHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetRecentWorkouts.php?page=1&pageSize=100`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.sessions) {
        const completed = new Set();
        const counts = {};
        
        data.sessions.forEach(workout => {
          const planName = (workout.plan_name || '').toString().toLowerCase().trim();
          const workoutPlanId = (workout.workout_plan_id || '').toString().toLowerCase().trim();
          
          // Check if this workout matches any session in the current program
          if (workoutPlanId.includes(`program_${programId}`)) {
            // Extract session ID from the workout_plan_id
            const match = workoutPlanId.match(/session_(\d+)/);
            if (match) {
              const sessionId = parseInt(match[1]);
              completed.add(sessionId);
              counts[sessionId] = (counts[sessionId] || 0) + 1;
            }
          }
          // Also check by plan name
          if (planName) {
            completed.add(planName);
            counts[planName] = (counts[planName] || 0) + 1;
          }
        });
        
        setCompletedSessions(completed);
        setSessionCompletionCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
  };

  const isSessionCompleted = (session) => {
    const sessionName = (session.session_name || session.name || '').toLowerCase().trim();
    return completedSessions.has(session.id) || completedSessions.has(sessionName);
  };

  const getSessionCompletionCount = (session) => {
    const sessionName = (session.session_name || session.name || '').toLowerCase().trim();
    return sessionCompletionCounts[session.id] || sessionCompletionCounts[sessionName] || 0;
  };

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
    navigate('/trainee-dashboard/my-plans', {
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
            name: ex.name || ex.exercise_name || ex.exerciseName || ex.title || 'Unknown Exercise',
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '10',
            rest: parseInt(ex.rest_seconds) || 60,
            notes: ex.notes || '',
            order_index: ex.order_index
          })),
          startTime: new Date(),
          completedSets: session.exercises.map(ex => Array.from({ length: parseInt(ex.sets) || 3 }, () => ({
            weight: 0,
            reps: 0,
            rpe: 0,
            notes: '',
            completed: false
          })))
        }
      }
    });
  };

  const mainContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'rgba(32, 214, 87, 0.8)', width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Loading program details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert" style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem' }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm ms-3"
            style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.4)', color: 'rgba(220, 53, 69, 0.95)' }}
            onClick={() => navigate('/trainee-dashboard/my-plans')}
          >
            Back to My Plans
          </button>
        </div>
      );
    }

    if (!program) {
      return (
        <div className="alert" style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem' }}>
          <i className="bi bi-info-circle me-2"></i>
          Program not found.
          <button 
            className="btn btn-sm ms-3"
            style={{ background: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.4)', color: 'rgba(255, 193, 7, 0.95)' }}
            onClick={() => navigate('/trainee-dashboard/my-plans')}
          >
            Back to My Plans
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn me-3"
            style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
            onClick={() => navigate('/trainee-dashboard/my-plans')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="flex-grow-1">
            <h2 className="mb-1" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{program.title}</h2>
            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>By {program.trainer_name}</p>
          </div>
          {isTrainerAssigned ? (
            <span className="badge fs-6" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(32, 214, 87, 0.95)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
              <i className="bi bi-person-check me-1"></i>
              Trainer Assigned
            </span>
          ) : (
            <span className="badge fs-6" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(32, 214, 87, 0.95)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
              <i className="bi bi-bag-check me-1"></i>
              Purchased
            </span>
          )}
        </div>

        {/* Program Info */}
        <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '1rem' }}>
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>About This Program</h5>
                <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>{program.description}</p>
                {program.long_description && (
                  <div className="mt-3">
                    <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>{program.long_description}</p>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <small className="d-block mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '500' }}>Category</small>
                    <div><span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{program.category}</span></div>
                  </div>
                  <div>
                    <small className="d-block mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '500' }}>Difficulty</small>
                    <div><span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{program.difficulty_level}</span></div>
                  </div>
                  <div>
                    <small className="d-block mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '500' }}>Duration</small>
                    <div><span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{program.duration_weeks} WEEKS</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-4">
          <h4 className="mb-4" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>
            <i className="bi bi-calendar-week me-2"></i>
            Workout Sessions ({program.sessions?.length || 0})
          </h4>
          
          {program.sessions && program.sessions.length > 0 ? (
            <div className="list-group list-group-flush">
              {[...program.sessions].sort((a, b) => {
                const aDone = isSessionCompleted(a);
                const bDone = isSessionCompleted(b);
                if (aDone && !bDone) return 1;
                if (!aDone && bDone) return -1;
                return (parseInt(a.id || 0) - parseInt(b.id || 0)) || 0;
              }).map((session, index) => {
                const completed = isSessionCompleted(session);
                const completionCount = getSessionCompletionCount(session);
                const isExpanded = expandedSessions.has(session.id);
                return (
                  <div key={session.id} className="list-group-item border-0 px-0" style={{ background: 'transparent' }}>
                    <div 
                      className="d-flex justify-content-between align-items-start mb-3 p-3" 
                      style={{ 
                        background: completed ? 'rgba(32, 214, 87, 0.1)' : 'rgba(30, 35, 30, 0.5)', 
                        border: completed ? '1px solid rgba(32, 214, 87, 0.4)' : '1px solid rgba(32, 214, 87, 0.2)', 
                        borderRadius: '0.75rem', 
                        transition: 'all 0.2s', 
                        cursor: 'pointer' 
                      }} 
                      onMouseEnter={(e) => e.currentTarget.style.background = completed ? 'rgba(32, 214, 87, 0.15)' : 'rgba(30, 35, 30, 0.7)'} 
                      onMouseLeave={(e) => e.currentTarget.style.background = completed ? 'rgba(32, 214, 87, 0.1)' : 'rgba(30, 35, 30, 0.5)'}
                      onClick={() => toggleSession(session.id)}
                    >
                      <div className="flex-grow-1 me-3">
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge me-2" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}>
                            Week {session.week_number || 1} • Day {session.day_number || index + 1}
                          </span>
                          {completed && (
                            <span className="badge me-2" style={{ background: 'rgba(32, 214, 87, 0.3)', color: 'rgba(32, 214, 87, 0.95)', borderRadius: '0.5rem' }}>
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Done{completionCount > 1 ? ` (${completionCount}x)` : ''}
                            </span>
                          )}
                          <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{session.session_name || session.name}</h6>
                        </div>
                        {(session.session_description || session.description) && (
                          <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{session.session_description || session.description}</p>
                        )}
                        <div className="d-flex align-items-center small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          <i className="bi bi-list-task me-1"></i>
                          <span>{session.exercises?.length || 0} exercises</span>
                          <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn"
                          style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(32, 214, 87, 0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(32, 214, 87, 0.2)'}
                          onClick={(e) => {
                            e.stopPropagation();
                            startSession(session);
                          }}
                        >
                          <i className={`bi ${completed ? 'bi-arrow-repeat' : 'bi-play-circle'} me-2`}></i>
                          {completed ? 'Do Again' : 'Start Session'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Show exercises preview - Expanding Section */}
                    {isExpanded && session.exercises && session.exercises.length > 0 && (
                      <div className="px-3 pb-3">
                        <div style={{ borderTop: '1px solid rgba(32, 214, 87, 0.2)', paddingTop: '1rem' }}>
                          <small className="d-block mb-2" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Exercises:</small>
                          <div className="d-flex flex-wrap gap-2">
                            {session.exercises.map((exercise, exIndex) => (
                              <span key={exIndex} className="badge" style={{ background: 'rgba(32, 214, 87, 0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem' }}>
                                {exercise.name || exercise.exercise_name || exercise.title || 'Unknown Exercise'} • {exercise.sets}x{exercise.reps || exercise.duration} {exercise.rpe ? `• RPE ${exercise.rpe}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="alert" style={{ background: 'rgba(13, 202, 240, 0.1)', border: '1px solid rgba(13, 202, 240, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem' }}>
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
      <div className="container-fluid px-3 px-md-4 py-3" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh', paddingBottom: '100px' }}>
        {mainContent()}

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.2)', background: 'rgba(15, 20, 15, 0.95)' }}>
                  <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{selectedSession.session_name || selectedSession.name}</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedSession(null)}
                  ></button>
                </div>
                <div className="modal-body" style={{ background: 'rgba(15, 20, 15, 0.95)' }}>
                  {(selectedSession.session_description || selectedSession.description) && (
                    <div className="mb-4">
                      <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>{selectedSession.session_description || selectedSession.description}</p>
                    </div>
                  )}

                  <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>Exercises ({selectedSession.exercises?.length || 0})</h6>
                  
                  {selectedSession.exercises?.map((ex, idx) => (
                    <div key={idx} className="card mb-2" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '0.75rem' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{idx + 1}. {ex.name}</h6>
                            <div className="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
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
                              <p className="small mb-0 mt-2" style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
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
                <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn"
                    style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                    onClick={() => setSelectedSession(null)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(32, 214, 87, 0.95)', borderRadius: '0.5rem' }}
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
