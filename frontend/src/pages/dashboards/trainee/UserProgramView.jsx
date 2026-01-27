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
            <p className="text-muted mb-0">Created by {program.trainer_name}</p>
          </div>
          <span className="badge bg-primary fs-6">
            <i className="bi bi-person-check me-1"></i>
            My Program
          </span>
        </div>

        {/* Program Info */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h5>About This Program</h5>
                <p className="text-muted">{program.description || 'No description available'}</p>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <small className="text-muted d-block">Duration</small>
                  <strong>{program.duration_weeks} weeks</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Difficulty</small>
                  <span className="badge bg-light text-dark">{program.difficulty_level}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Category</small>
                  <span className="badge bg-light text-dark">{program.category}</span>
                </div>
                <div>
                  <small className="text-muted d-block">Total Sessions</small>
                  <strong>{program.session_count} sessions</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout Sessions */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <h5 className="mb-0">
              <i className="bi bi-calendar-week me-2"></i>
              Workout Sessions
            </h5>
          </div>
          <div className="card-body">
            {!program.sessions || program.sessions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                <p>No sessions available in this program</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {program.sessions.map((session, index) => (
                  <div key={session.id} className="list-group-item border-0 px-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1 me-3">
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge bg-primary me-2">
                            Week {session.week_number} • Day {session.day_number}
                          </span>
                          <h6 className="mb-0">{session.session_name}</h6>
                        </div>
                        {session.session_description && (
                          <p className="text-muted small mb-2">{session.session_description}</p>
                        )}
                        <div className="d-flex align-items-center text-muted small">
                          <i className="bi bi-list-task me-1"></i>
                          <span>{session.exercise_count} exercises</span>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => startSession(session)}
                      >
                        <i className="bi bi-play-circle me-2"></i>
                        Start Session
                      </button>
                    </div>
                    
                    {/* Show exercises preview */}
                    {session.exercises && session.exercises.length > 0 && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted d-block mb-2">Exercises:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {session.exercises.map((exercise, exIndex) => (
                            <span key={exIndex} className="badge bg-light text-dark">
                              {exercise.name} • {exercise.sets}x{exercise.reps || exercise.duration}
                            </span>
                          ))}
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
      <div className="container-fluid py-4">
        {mainContent()}
      </div>
    </TraineeDashboard>
  );
};

export default UserProgramView;
