import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';
import '../../../styles/CoachPage.css';

const MyCoach = () => {
  const [coach, setCoach] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoachData();
    fetchAssignedPrograms();
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetRecentWorkouts.php?page=1&pageSize=100`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.sessions) {
        setWorkoutHistory(data.sessions);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  const fetchAssignedPrograms = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/GetMyAssignedPrograms.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.programs && data.programs.length > 0) {
        // Fetch full details for each program including sessions and exercises
        const programsWithDetails = await Promise.all(
          data.programs.map(async (program) => {
            try {
              const detailsResponse = await fetch(
                `${BACKEND_ROUTES_API}GetCustomProgramDetails.php?programId=${program.id}`,
                { credentials: 'include' }
              );
              const detailsData = await detailsResponse.json();
              if (detailsData.success && detailsData.program) {
                return {
                  ...program,
                  sessions: detailsData.program.sessions || []
                };
              }
            } catch (err) {
              console.error('Error fetching program details:', err);
            }
            return program;
          })
        );
        setAssignedPrograms(programsWithDetails);
      } else {
        setAssignedPrograms([]);
      }
    } catch (error) {
      console.error('Error loading assigned programs:', error);
      setAssignedPrograms([]);
    }
  };

  // Once we have both programs and history, find the next session
  useEffect(() => {
    if (assignedPrograms.length > 0) {
      const next = findNextWorkoutSession();
      setNextSession(next);
    }
  }, [assignedPrograms, workoutHistory]);

  const findNextWorkoutSession = () => {
    if (!assignedPrograms || assignedPrograms.length === 0) {
      return null;
    }

    // Build a map of completed sessions per program
    // Key: program_id, Value: { sessionIds: Set, count: number, lastWorkoutDate: Date }
    const programProgress = {};
    
    // Initialize progress for all assigned programs
    assignedPrograms.forEach(program => {
      programProgress[program.id] = {
        sessionIds: new Set(),
        completedCount: 0,
        totalSessions: program.sessions?.length || 0,
        lastWorkoutDate: null
      };
    });

    // Analyze workout history to find completed sessions per program
    workoutHistory.forEach(workout => {
      const planName = (workout.plan_name || '').toString().toLowerCase().trim();
      const workoutPlanId = (workout.workout_plan_id || '').toString().toLowerCase().trim();
      const workoutDate = workout.date ? new Date(workout.date) : null;
      
      // Check if this workout matches any program session
      assignedPrograms.forEach(program => {
        if (!program.sessions) return;
        
        // Check if workout belongs to this program
        if (workoutPlanId.includes(`program_${program.id}`)) {
          // Extract specific session ID using regex
          const match = workoutPlanId.match(/session_(\d+)/);
          if (match) {
            const sessionId = parseInt(match[1]);
            const session = program.sessions.find(s => s.id === sessionId);
            if (session) {
              const progress = programProgress[program.id];
              if (!progress.sessionIds.has(sessionId)) {
                progress.sessionIds.add(sessionId);
                progress.completedCount++;
              }
              // Track most recent workout date for this program
              if (workoutDate && (!progress.lastWorkoutDate || workoutDate > progress.lastWorkoutDate)) {
                progress.lastWorkoutDate = workoutDate;
              }
            }
          }
        }
        
        // Also check by plan name matching session name
        program.sessions.forEach(session => {
          const sessionName = (session.session_name || session.name || '').toLowerCase().trim();
          if (planName && planName === sessionName) {
            const progress = programProgress[program.id];
            if (!progress.sessionIds.has(session.id)) {
              progress.sessionIds.add(session.id);
              progress.completedCount++;
            }
            if (workoutDate && (!progress.lastWorkoutDate || workoutDate > progress.lastWorkoutDate)) {
              progress.lastWorkoutDate = workoutDate;
            }
          }
        });
      });
    });

    // Find the most recently active program (the one user is currently working on)
    let activeProgram = null;
    let latestDate = null;
    
    assignedPrograms.forEach(program => {
      const progress = programProgress[program.id];
      if (progress.completedCount > 0 && progress.lastWorkoutDate) {
        if (!latestDate || progress.lastWorkoutDate > latestDate) {
          latestDate = progress.lastWorkoutDate;
          activeProgram = program;
        }
      }
    });

    // If no active program found (no workouts done yet), use the first assigned program
    if (!activeProgram) {
      activeProgram = assignedPrograms[0];
    }

    // Now find the next uncompleted session in the active program
    if (activeProgram && activeProgram.sessions && activeProgram.sessions.length > 0) {
      const progress = programProgress[activeProgram.id];
      
      // Sort sessions by week and day
      const sortedSessions = [...activeProgram.sessions].sort((a, b) => {
        const weekA = a.week_number || 1;
        const weekB = b.week_number || 1;
        const dayA = a.day_number || 1;
        const dayB = b.day_number || 1;
        if (weekA !== weekB) return weekA - weekB;
        return dayA - dayB;
      });

      // Find the first uncompleted session
      for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        if (!progress.sessionIds.has(session.id)) {
          return {
            program: activeProgram,
            session: session,
            progress: {
              completed: progress.completedCount,
              total: progress.totalSessions,
              sessionNumber: i + 1
            }
          };
        }
      }

      // All sessions completed - offer to restart
      return {
        program: activeProgram,
        session: sortedSessions[0],
        allCompleted: true,
        progress: {
          completed: progress.completedCount,
          total: progress.totalSessions,
          sessionNumber: 1
        }
      };
    }
    
    return null;
  };

  const handleStartWorkout = () => {
    if (!nextSession) {
      // No assigned programs, go to general workout page
      navigate('/trainee-dashboard/workouts');
      return;
    }

    // Start the specific session
    navigate('/trainee-dashboard/workouts', {
      state: {
        startWorkout: true,
        workoutData: {
          id: `program_${nextSession.program.id}_session_${nextSession.session.id}`,
          name: nextSession.session.session_name || nextSession.session.name,
          description: nextSession.session.session_description || nextSession.session.description || '',
          programId: nextSession.program.id,
          programTitle: nextSession.program.title,
          sessionId: nextSession.session.id,
          exercises: nextSession.session.exercises?.map(ex => ({
            id: ex.exercise_id || ex.id,
            name: ex.exercise_name || ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '10',
            weight: ex.weight || '',
            rest_time: ex.rest_time || '60',
            notes: ex.notes || ''
          })) || []
        }
      }
    });
  };

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      
      // Fetch current coach relationship
      const resp = await fetch(`${BACKEND_ROUTES_API}GetMyCoach.php`, { 
        credentials: 'include' 
      });
      const data = await resp.json();
      
      if (data.success && data.coach) {
        // Convert string numbers to actual numbers and parse specializations
        let specializations = 'Personal Trainer';
        try {
          const specs = data.coach.specializations;
          if (specs && specs !== '[]' && specs !== '0') {
            // Try parsing as JSON first
            try {
              const parsed = JSON.parse(specs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                specializations = parsed.join(', ');
              } else if (typeof specs === 'string' && specs.trim()) {
                specializations = specs;
              }
            } catch {
              // If not JSON, use as-is if not empty
              if (specs.trim()) specializations = specs;
            }
          }
        } catch (e) {
          console.error('Error parsing specializations:', e);
        }
        
        const coachData = {
          ...data.coach,
          average_rating: parseFloat(data.coach.average_rating) || 0,
          review_count: parseInt(data.coach.review_count) || 0,
          years_of_experience: parseInt(data.coach.years_of_experience) || 0,
          specializations: specializations
        };
        console.log('Coach data loaded:', coachData);
        console.log('Trainer ID:', coachData.trainer_id);
        setCoach(coachData);
        
        // Fetch my review if I've reviewed this trainer
        const reviewResp = await fetch(
          `${BACKEND_ROUTES_API}GetMyReview.php?reviewee_id=${data.coach.trainer_id}`, 
          { credentials: 'include' }
        );
        const reviewData = await reviewResp.json();
        
        if (reviewData.success && reviewData.has_reviewed) {
          setMyReview(reviewData.review);
          setRating(reviewData.review.rating);
          setReviewText(reviewData.review.review_text || '');
        }
      }
    } catch (err) {
      console.error('Error fetching coach:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageTrainer = () => {
    navigate('/messages', { state: { selectedUserId: coach.trainer_id } });
  };

  const handleDisconnect = async () => {
    if (!disconnectReason.trim()) {
      setToast({ show: true, message: 'Please provide a reason for disconnecting', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}DisconnectCoaching.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_id: coach.relationship_id,
          reason: disconnectReason
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowDisconnectModal(false);
        setCoach(null);
        setToast({ show: true, message: 'Successfully disconnected from trainer', type: 'success' });
      } else {
        setToast({ show: true, message: result.message || 'Failed to disconnect', type: 'danger' });
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setToast({ show: true, message: 'Failed to disconnect. Please try again.', type: 'danger' });
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setToast({ show: true, message: 'Please select a rating', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}SubmitReview.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewee_id: coach.trainer_id,
          rating: rating,
          review_text: reviewText
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowReviewModal(false);
        setMyReview({ rating, review_text: reviewText });
        setToast({ 
          show: true, 
          message: `Review ${result.action === 'created' ? 'submitted' : 'updated'} successfully!`, 
          type: 'success' 
        });
        fetchCoachData(); // Refresh to get updated rating
      } else {
        setToast({ show: true, message: result.message || 'Failed to submit review', type: 'danger' });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setToast({ show: true, message: 'Failed to submit review. Please try again.', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <TraineeDashboard>
        <div className="text-center py-5" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
          <div className="spinner-border" style={{ color: 'rgba(32, 214, 87, 0.8)' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Loading your trainer...</p>
        </div>
      </TraineeDashboard>
    );
  }

  if (!coach) {
    return (
      <TraineeDashboard>
        <div className="container-fluid px-4 py-5" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
          <div className="text-center py-5" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem', padding: '3rem' }}>
            <i className="bi bi-person-x fs-1 mb-3 d-block" style={{ color: 'rgba(32, 214, 87, 0.6)' }}></i>
            <h4 className="mb-3" style={{ color: 'rgba(255,255,255,0.95)' }}>No Active Trainer</h4>
            <p className="mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>You don't have a trainer yet. Find one to start your fitness journey!</p>
            <button 
              className="btn btn-lg"
              style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 2rem', borderRadius: '0.5rem' }}
              onClick={() => navigate('/trainee-dashboard/find-trainer')}
            >
              <i className="bi bi-search me-2"></i>
              Find a Trainer
            </button>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="coach-page container-fluid px-3 px-md-4 py-4" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh', paddingBottom: '100px' }}>
        <div className="row g-4">
          {/* Left Column - Coach Info */}
          <div className="col-lg-8">
            <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
              <div className="card-body p-4">
                <div className="text-center mb-3">
                  <div className="trainer-avatar mb-3 d-flex justify-content-center">
                    {coach.image ? (
                      <img src={coach.image} alt={coach.name} className="rounded-circle" width="80" height="80" />
                    ) : (
                      <div className="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px', fontSize: '2rem', background: 'rgba(32, 214, 87, 0.2)', border: '2px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.95)'}}>
                        {coach.name?.charAt(0) || 'T'}
                      </div>
                    )}
                  </div>
                  <h3 className="mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>{coach.name || coach.username}</h3>
                  <p className="mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <i className="bi bi-award me-1" style={{ color: 'rgba(32, 214, 87, 0.8)' }}></i>
                    {coach.specializations || 'Personal Trainer'}
                  </p>
                  {coach.average_rating > 0 && (
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-star-fill me-1" style={{ color: '#ffc107' }}></i>
                      <span className="fw-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>{coach.average_rating.toFixed(1)}</span>
                      <span className="ms-1" style={{ color: 'rgba(255,255,255,0.6)' }}>({coach.review_count} reviews)</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button 
                    className="btn flex-grow-1"
                    style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}
                    onClick={handleMessageTrainer}
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    Message
                  </button>
                  <button 
                    className="btn"
                    style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}
                    onClick={() => setShowReviewModal(true)}
                  >
                    <i className="bi bi-star me-2"></i>
                    Review
                  </button>
                </div>
              </div>
            </div>

            {/* About Section - Only show if bio exists */}
            {coach.bio && (
              <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.25rem' }}>
                  <h6 className="mb-0 fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    <i className="bi bi-person me-2"></i>
                    About {coach.name?.split(' ')[0] || 'Trainer'}
                  </h6>
                </div>
                <div className="card-body">
                  <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '0' }}>
                    {coach.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Certifications & Experience - Only show if data exists */}
            {(coach.years_experience || coach.certifications) && (
              <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.25rem' }}>
                  <h6 className="mb-0 fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    <i className="bi bi-award me-2"></i>
                    Credentials & Experience
                  </h6>
                </div>
                <div className="card-body">
                  {coach.years_experience && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-clock me-2" style={{ color: 'rgba(32, 214, 87, 0.8)' }}></i>
                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                          <strong>{coach.years_experience}</strong> years of experience
                        </span>
                      </div>
                    </div>
                  )}
                  {coach.certifications && (
                    <div className="mb-0">
                      <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Certifications:</strong>
                      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0', marginTop: '0.5rem', fontSize: '0.9rem' }}>{coach.certifications}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Latest Program */}
            <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.25rem' }}>
                <h6 className="mb-0 fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  <i className="bi bi-play-circle me-2"></i>
                  {nextSession ? 'Next Workout' : 'Training Programs'}
                </h6>
                {nextSession?.progress && (
                  <span className="badge" style={{ 
                    background: nextSession.allCompleted ? 'rgba(255, 193, 7, 0.2)' : 'rgba(32, 214, 87, 0.2)', 
                    color: nextSession.allCompleted ? 'rgba(255, 193, 7, 0.95)' : 'rgba(255,255,255,0.9)', 
                    fontSize: '0.75rem', 
                    padding: '0.35rem 0.6rem' 
                  }}>
                    {nextSession.allCompleted ? (
                      <><i className="bi bi-trophy-fill me-1"></i>100%</>
                    ) : (
                      <>{nextSession.progress.completed}/{nextSession.progress.total} done</>
                    )}
                  </span>
                )}
              </div>
              <div className="card-body">
                {nextSession ? (
                  <>
                    {/* Progress Bar */}
                    {nextSession.progress && nextSession.progress.total > 0 && (
                      <div className="mb-3">
                        {nextSession.allCompleted ? (
                          <div className="text-center p-3" style={{ background: 'linear-gradient(135deg, rgba(32, 214, 87, 0.2), rgba(32, 214, 87, 0.1))', borderRadius: '0.75rem', border: '1px solid rgba(32, 214, 87, 0.4)' }}>
                            <i className="bi bi-trophy-fill mb-2" style={{ fontSize: '2rem', color: 'rgba(255, 193, 7, 0.9)' }}></i>
                            <h5 className="mb-1" style={{ color: 'rgba(32, 214, 87, 0.95)', fontWeight: '600' }}>100% Completed!</h5>
                            <small style={{ color: 'rgba(255,255,255,0.7)' }}>All {nextSession.progress.total} sessions done</small>
                          </div>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small style={{ color: 'rgba(255,255,255,0.6)' }}>Program Progress</small>
                              <small style={{ color: 'rgba(32, 214, 87, 0.9)' }}>
                                {Math.round((nextSession.progress.completed / nextSession.progress.total) * 100)}%
                              </small>
                            </div>
                            <div style={{ background: 'rgba(30, 35, 30, 0.8)', borderRadius: '0.25rem', height: '6px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  background: 'linear-gradient(90deg, rgba(32, 214, 87, 0.6), rgba(32, 214, 87, 0.9))', 
                                  width: `${(nextSession.progress.completed / nextSession.progress.total) * 100}%`, 
                                  height: '100%', 
                                  borderRadius: '0.25rem',
                                  transition: 'width 0.3s ease'
                                }}
                              ></div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="mb-3 p-3" style={{ background: 'rgba(32, 214, 87, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)' }}>
                              {nextSession.session.session_name || nextSession.session.name}
                            </h6>
                            {nextSession.progress && (
                              <span className="badge" style={{ background: 'rgba(30, 35, 30, 0.8)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 'normal' }}>
                                Session {nextSession.progress.sessionNumber}
                              </span>
                            )}
                          </div>
                          <p className="small mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <i className="bi bi-folder me-1"></i>
                            {nextSession.program.title}
                          </p>
                          {nextSession.session.exercises && (
                            <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              <i className="bi bi-list-check me-1"></i>
                              {nextSession.session.exercises.length} exercises
                            </p>
                          )}
                        </div>
                        <i className="bi bi-lightning-fill" style={{ color: 'rgba(32, 214, 87, 0.8)', fontSize: '1.5rem' }}></i>
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button 
                        className="btn flex-grow-1"
                        style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                        onClick={handleStartWorkout}
                      >
                        <i className={`bi ${nextSession.allCompleted ? 'bi-arrow-repeat' : 'bi-play-fill'} me-2`}></i>
                        {nextSession.allCompleted ? 'Repeat Session' : 'Start Session'}
                      </button>
                      <button 
                        className="btn"
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                        onClick={() => navigate('/trainee-dashboard/my-plans')}
                      >
                        <i className="bi bi-list-task me-2"></i>
                        All Programs
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="flex-grow-1">
                        <h6 className="mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                          {assignedPrograms.length > 0 ? 'Ready to train?' : 'Explore Training Options'}
                        </h6>
                        <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {assignedPrograms.length > 0 
                            ? 'Start your next workout session or view all programs'
                            : 'Browse available programs and create your workout routine'
                          }
                        </p>
                      </div>
                      <i className="bi bi-arrow-right-circle" style={{ color: 'rgba(32, 214, 87, 0.8)', fontSize: '1.5rem' }}></i>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button 
                        className="btn flex-grow-1"
                        style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                        onClick={handleStartWorkout}
                      >
                        <i className="bi bi-lightning me-2"></i>
                        Start Workout
                      </button>
                      <button 
                        className="btn"
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                        onClick={() => navigate('/trainee-dashboard/my-plans')}
                      >
                        <i className="bi bi-list-task me-2"></i>
                        View Programs
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className="col-lg-4">
            {/* Connection Info */}
            <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
              <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.25rem' }}>
                <h6 className="mb-0 fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Connection Info
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Connected Since</small>
                  <div className="fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>{new Date(coach.started_at).toLocaleDateString()}</div>
                </div>
                <div className="mb-3">
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Status</small>
                  <div><span className="badge" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(32, 214, 87, 0.4)', borderRadius: '0.5rem' }}>ACTIVE</span></div>
                </div>
              </div>
            </div>

            {/* My Review */}
            {myReview && (
              <div className="card mb-3" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.25rem' }}>
                  <h6 className="mb-0 fw-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    <i className="bi bi-star me-2"></i>
                    My Review
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`bi bi-star${star <= myReview.rating ? '-fill' : ''}`} style={{ color: '#ffc107' }}></i>
                    ))}
                  </div>
                  {myReview.review_text && (
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>{myReview.review_text}</p>
                  )}
                  <button 
                    className="btn btn-sm p-0 mt-2 text-decoration-none"
                    style={{ background: 'transparent', border: 'none', color: 'rgba(32, 214, 87, 0.9)', cursor: 'pointer' }}
                    onClick={() => setShowReviewModal(true)}
                  >
                    Edit review
                  </button>
                </div>
              </div>
            )}

            {/* Settings - Disconnect is here (subtle) */}
            <div className="card" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
              <div className="card-body">
                <details className="settings-accordion">
                  <summary style={{cursor: 'pointer', userSelect: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem'}}>
                    <i className="bi bi-gear me-2"></i>
                    Relationship Settings
                  </summary>
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(32, 214, 87, 0.2)' }}>
                    <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      If you need to change trainers, you can end this coaching relationship.
                    </p>
                    <button 
                      className="btn btn-sm w-100"
                      style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.4)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }}
                      onClick={() => setShowDisconnectModal(true)}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      End Coaching Relationship
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Disconnect Modal */}
        {showDisconnectModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.95)' }}>End Coaching Relationship?</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowDisconnectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Are you sure you want to end your coaching relationship with <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{coach.name}</strong>? 
                    This action will disconnect you from your trainer.
                  </p>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Reason for disconnecting (required)</label>
                    <textarea 
                      className="form-control" 
                      style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                      rows="3"
                      value={disconnectReason}
                      onChange={(e) => setDisconnectReason(e.target.value)}
                      placeholder="Please let us know why you're disconnecting..."
                    ></textarea>
                  </div>
                  <div className="alert small mb-0" style={{ background: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    You can find a new trainer after disconnecting.
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(32, 214, 87, 0.2)' }}>
                  <button className="btn" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }} onClick={() => setShowDisconnectModal(false)}>
                    Cancel
                  </button>
                  <button className="btn" style={{ background: 'rgba(220, 53, 69, 0.3)', border: '1px solid rgba(220, 53, 69, 0.5)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }} onClick={handleDisconnect}>
                    Confirm Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.95)' }}>{myReview ? 'Edit' : 'Rate'} Your Trainer</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowReviewModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Rating</label>
                    <div className="star-rating-input" style={{fontSize: '2rem'}}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <i 
                          key={star}
                          className={`bi bi-star${star <= (hoverRating || rating) ? '-fill' : ''}`}
                          style={{cursor: 'pointer', marginRight: '0.25rem', color: '#ffc107'}}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        ></i>
                      ))}
                    </div>
                    {rating > 0 && (
                      <small style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Improvement'}
                      </small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Review (Optional)</label>
                    <textarea 
                      className="form-control" 
                      style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                      rows="4"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this trainer..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(32, 214, 87, 0.2)' }}>
                  <button className="btn" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }} onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </button>
                  <button className="btn" style={{ background: 'rgba(32, 214, 87, 0.3)', border: '1px solid rgba(32, 214, 87, 0.5)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }} onClick={handleSubmitReview}>
                    <i className="bi bi-check-lg me-2"></i>
                    {myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
            <div className="toast show align-items-center border-0" style={{ background: toast.type === 'success' ? 'rgba(32, 214, 87, 0.3)' : 'rgba(220, 53, 69, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }} role="alert">
              <div className="d-flex">
                <div className="toast-body">
                  <i className={`bi bi-${
                    toast.type === 'success' ? 'check-circle' : 
                    toast.type === 'danger' ? 'x-circle' : 
                    'exclamation-triangle'
                  } me-2`} style={{ color: toast.type === 'success' ? 'rgba(32, 214, 87, 0.9)' : 'rgba(220, 53, 69, 0.9)' }}></i>
                  {toast.message}
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white me-2 m-auto" 
                  onClick={() => setToast({ show: false, message: '', type: '' })}
                ></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default MyCoach;