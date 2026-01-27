# Trainee-Trainer Connection System

## Overview
This feature allows trainees to search for trainers, request connections, and trainers can accept or decline these requests.

## Setup Instructions

### 1. Database Setup

First, run the setup script to create the necessary database tables:

```bash
# Navigate to backend routes
cd /Applications/XAMPP/xamppfiles/htdocs/CoachFlow/backend/src/routes

# Run the setup script
php SetupTrainerProfiles.php
```

Or access it via browser:
```
http://localhost/CoachFlow/backend/src/routes/SetupTrainerProfiles.php
```

This will create:
- `trainer_profiles` table: Stores trainer profile information
- Default profiles for existing trainers (if any)

### 2. Verify Tables Exist

Make sure these tables exist in your database:
- `coaching_requests` (should already exist)
- `coaching_relationships` (should already exist)
- `trainer_profiles` (created by setup script)

## Features

### For Trainees

#### 1. Find Trainers
- **Route**: `/trainee-dashboard/find-trainer`
- **Component**: `FindTrainersPage.jsx`
- **Features**:
  - Search by name, specialization, or keywords
  - Filter by:
    - Specialization (Weight Loss, Muscle Building, etc.)
    - Minimum rating (3+, 4+, 4.5+ stars)
    - Price range
    - Experience level
    - Verified trainers only
  - Sort by:
    - Highest rated
    - Price (low to high / high to low)
    - Most experienced
    - Most popular
    - Newest
  - View connection status (None, Pending, Connected)
  - Request connection with trainers

#### 2. Request Connection
- Click "Request Connection" button on any trainer card
- Fill out form with:
  - Experience level (required)
  - Fitness goals (required)
  - Optional message to trainer
- System prevents duplicate requests
- System prevents requests if already connected

#### 3. Track Connection Requests
- **Route**: `/trainee-dashboard/my-requests`
- **Component**: `MyConnectionRequestsPage.jsx`
- **Features**:
  - View all sent connection requests
  - See status (Pending, Accepted, Declined)
  - View trainer details
  - Access accepted connections

### For Trainers

#### 1. View Coaching Requests
- **Route**: `/trainer-dashboard/clients`
- **Component**: `TrainerClients.jsx`
- **Features**:
  - See pending connection requests
  - View trainee information:
    - Name and email
    - Experience level
    - Goals
    - Message
  - Accept or decline requests

#### 2. Accept/Decline Requests
- **Accept**: Creates active coaching relationship
- **Decline**: Updates request status to declined
- Trainees are notified of the decision

## API Endpoints

### Backend Routes Created/Updated

1. **GetAvailableTrainers.php**
   - Method: GET
   - Auth: trainee, trainer
   - Params: search, specialization, minRating, maxRate, minRate, experienceLevel, verified, sortBy, limit, offset
   - Returns: List of trainers with filtering and sorting

2. **SendCoachingRequest.php**
   - Method: POST
   - Auth: trainee only
   - Body: { trainerId, message, experienceLevel, goals }
   - Returns: Success/error message

3. **GetTraineeCoachingRequests.php**
   - Method: GET
   - Auth: trainee only
   - Returns: List of trainee's coaching requests

4. **AcceptCoachingRequest.php** (existing)
   - Method: POST
   - Auth: trainer only
   - Body: { requestId }
   - Returns: Success/error message

5. **DeclineCoachingRequest.php** (existing)
   - Method: POST
   - Auth: trainer only
   - Body: { requestId }
   - Returns: Success/error message

6. **GetCoachingRequests.php** (existing)
   - Method: GET
   - Auth: trainer only
   - Returns: List of pending requests for trainer

## User Flow

### Trainee Journey
1. Login as trainee
2. Navigate to "Find Trainers" (from dashboard or nav menu)
3. Browse trainers, use search/filters as needed
4. Click "Request Connection" on desired trainer
5. Fill out connection request form
6. Submit request
7. Check "My Requests" to track status
8. When accepted, connect with trainer via coach page

### Trainer Journey
1. Login as trainer
2. Navigate to "Clients" page
3. See notification of pending requests
4. Review request details (trainee info, goals, message)
5. Accept or decline request
6. If accepted, trainee becomes active client

## Navigation Updates

### Trainee Dashboard Bottom Nav
- Home
- Create (Programs)
- **Trainers** (new - links to Find Trainers page)
- My Plans
- Chat

### Trainee Dashboard Links
- Dashboard shows "Browse Trainers" button when no coaches available
- Coach page has "Find a Trainer" button when no coach assigned
- "View All" button on Popular Coaches section

## Database Schema

### trainer_profiles
```sql
CREATE TABLE trainer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    specializations JSON,
    certifications JSON,
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    availability_status ENUM('available', 'limited', 'unavailable') DEFAULT 'available',
    max_clients INT DEFAULT 10,
    current_clients INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    profile_image VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE
)
```

### coaching_requests (existing)
```sql
CREATE TABLE coaching_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    trainee_id INT NOT NULL,
    message TEXT,
    experience_level VARCHAR(50),
    goals TEXT,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (trainer_id) REFERENCES user(userid),
    FOREIGN KEY (trainee_id) REFERENCES user(userid)
)
```

### coaching_relationships (existing)
```sql
CREATE TABLE coaching_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    trainee_id INT NOT NULL,
    status ENUM('active', 'paused', 'ended') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (trainer_id) REFERENCES user(userid),
    FOREIGN KEY (trainee_id) REFERENCES user(userid)
)
```

## Testing

### Test Scenario 1: Trainee Requests Connection
1. Login as trainee
2. Go to Find Trainers
3. Search/filter for a trainer
4. Click "Request Connection"
5. Fill form and submit
6. Verify request appears in "My Requests" with status "Pending"
7. Verify trainer cannot be requested again (button should show "Pending")

### Test Scenario 2: Trainer Accepts Request
1. Login as trainer
2. Go to Clients page
3. See pending request notification
4. Click to view request details
5. Click "Accept"
6. Verify trainee appears in active clients list
7. Verify relationship created in database

### Test Scenario 3: Trainer Declines Request
1. Login as trainer
2. Go to Clients page
3. Click "Decline" on a request
4. Verify request removed from pending
5. Login as trainee
6. Check "My Requests" - verify status shows "Declined"

## Troubleshooting

### Issue: "trainer_profiles table not found"
**Solution**: Run the SetupTrainerProfiles.php script

### Issue: No trainers showing up
**Solution**: 
1. Check if trainer_profiles table has data
2. Run: `INSERT INTO trainer_profiles (user_id, bio, hourly_rate) SELECT userid, 'Test bio', 50.00 FROM user WHERE privilege = 'trainer'`

### Issue: Cannot send request
**Solution**: 
1. Check if trainee is authenticated
2. Verify trainer ID exists
3. Check for existing pending requests or active relationships

### Issue: Trainer not receiving requests
**Solution**:
1. Check coaching_requests table for pending requests
2. Verify trainer_id matches user.userid
3. Check GetCoachingRequests.php is being called correctly

## Future Enhancements

- Add trainer profile detail page
- Implement messaging between trainee and trainer
- Add notification system for request status changes
- Add ability to cancel pending requests
- Add trainer reviews and ratings system
- Add booking/scheduling system
- Add payment integration for trainer services
