import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TraineeDashboard from '../../../components/TraineeDashboard';

const UserProgramView = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgramDetails();
  }, [programId]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetUserProgramDetails.php?programId=${programId}`);
      
      if (data.success) {
        setProgram(data.program);
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
    // Navigate to workout session with the session data
    navigate('/trainee-dashboard/workouts', {
      state: {
        startWorkout: true,
        workoutData: {
          id: parseInt(programId), // Use the actual program package ID for database foreign key
          name: session.session_name,
          description: session.session_description || '',
          programId: programId,
          programTitle: program.title,
          sessionId: session.id,
          exercises: session.exercises.map(ex => ({
            id: ex.exercise_id,
            name: ex.name,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || '10',
            rest: 60,
            notes: '',
            order_index: ex.exercise_order
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
          <div className="spinner-border" style={{ color: 'rgba(32, 214, 87, 0.8)' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Loading program details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert" style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem', padding: '1rem' }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm ms-3"
            style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.4)', color: 'rgba(255,255,255,0.9)' }}
            onClick={() => navigate('/trainee-dashboard/workouts')}
          >
            Back to My Workouts
          </button>
        </div>
      );
    }

    if (!program) {
      return (
        <div className="alert" style={{ background: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem', padding: '1rem' }}>
          <i className="bi bi-info-circle me-2"></i>
          Program not found.
          <button 
            className="btn btn-sm ms-3"
            style={{ background: 'rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.4)', color: 'rgba(255,255,255,0.9)' }}
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
            className="btn me-3"
            style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
            onClick={() => navigate('/trainee-dashboard/workouts')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="flex-grow-1">
            <h2 className="mb-1" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{program.title}</h2>
            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>Created by {program.trainer_name}</p>
          </div>
          <span className="badge fs-6" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
            <i className="bi bi-person-check me-1"></i>
            My Program
          </span>
        </div>

        {/* Program Info */}
        <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>About This Program</h5>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>{program.description || 'No description available'}</p>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <small className="d-block" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Duration</small>
                  <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>{program.duration_weeks} weeks</strong>
                </div>
                <div className="mb-3">
                  <small className="d-block" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Difficulty</small>
                  <span className="badge" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}>{program.difficulty_level}</span>
                </div>
                <div className="mb-3">
                  <small className="d-block" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Category</small>
                  <span className="badge" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}>{program.category}</span>
                </div>
                <div>
                  <small className="d-block" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Sessions</small>
                  <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>{program.session_count} sessions</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout Sessions */}
        <div className="card" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
          <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.5rem' }}>
            <h5 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>
              <i className="bi bi-calendar-week me-2"></i>
              Workout Sessions
            </h5>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            {!program.sessions || program.sessions.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                <p>No sessions available in this program</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {program.sessions.map((session, index) => (
                  <div key={session.id} className="list-group-item border-0 px-0" style={{ background: 'transparent' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3 p-3" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '0.75rem', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 35, 30, 0.7)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30, 35, 30, 0.5)'}>
                      <div className="flex-grow-1 me-3">
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge me-2" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}>
                            Week {session.week_number} • Day {session.day_number}
                          </span>
                          <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{session.session_name}</h6>
                        </div>
                        {session.session_description && (
                          <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{session.session_description}</p>
                        )}
                        <div className="d-flex align-items-center small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          <i className="bi bi-list-task me-1"></i>
                          <span>{session.exercise_count} exercises</span>
                        </div>
                      </div>
                      <button 
                        className="btn"
                        style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(32, 214, 87, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(32, 214, 87, 0.2)'}
                        onClick={() => startSession(session)}
                      >
                        <i className="bi bi-play-circle me-2"></i>
                        Start Session
                      </button>
                    </div>
                    
                    {/* Show exercises preview */}
                    {session.exercises && session.exercises.length > 0 && (
                      <div className="px-3 pb-3">
                        <div style={{ borderTop: '1px solid rgba(32, 214, 87, 0.2)', paddingTop: '1rem' }}>
                          <small className="d-block mb-2" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Exercises:</small>
                          <div className="d-flex flex-wrap gap-2">
                            {session.exercises.map((exercise, exIndex) => (
                              <span key={exIndex} className="badge" style={{ background: 'rgba(32, 214, 87, 0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem' }}>
                                {exercise.name} • {exercise.sets}x{exercise.reps || exercise.duration}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TraineeDashboard>
      <div className="container-fluid py-4" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh', paddingBottom: '100px' }}>
        {mainContent()}
      </div>
    </TraineeDashboard>
  );
};

export default UserProgramView;
