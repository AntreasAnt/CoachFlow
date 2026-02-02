# Review System Implementation Guide

## Overview
A comprehensive 5-star review system allowing trainers and trainees to rate each other. Reviews can only be submitted between users with active coaching relationships.

## Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_id INT NOT NULL,              -- User who wrote the review
    reviewee_id INT NOT NULL,              -- User being reviewed
    rating INT NOT NULL (1-5),             -- Star rating
    review_text TEXT,                       -- Optional review text
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE KEY (reviewer_id, reviewee_id)  -- One review per user pair
)
```

### Rating Statistics View
Automatically aggregates rating data for quick access:
- `review_count` - Total number of reviews
- `average_rating` - Average star rating
- `five_star_count` through `one_star_count` - Distribution
- `last_review_date` - Most recent review timestamp

## API Endpoints

### 1. Submit/Update Review
**Endpoint:** `POST /SubmitReview.php`

**Request Body:**
```json
{
  "reviewee_id": 123,
  "rating": 5,
  "review_text": "Great trainer, very professional!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review_id": 456,
  "action": "created"  // or "updated"
}
```

**Business Rules:**
- Users can only review those with active coaching relationships
- One review per user pair (subsequent submissions update existing review)
- Rating must be 1-5
- Cannot review yourself
- Review text is optional

---

### 2. Get Reviews for a User
**Endpoint:** `GET /GetReviews.php?user_id=123&include_reviewer_info=true`

**Parameters:**
- `user_id` (optional) - User to get reviews for (defaults to current user)
- `include_reviewer_info` (optional) - Include reviewer names/details

**Response:**
```json
{
  "success": true,
  "user_id": 123,
  "stats": {
    "review_count": 45,
    "average_rating": 4.67,
    "five_star_count": 30,
    "four_star_count": 12,
    "three_star_count": 3,
    "two_star_count": 0,
    "one_star_count": 0
  },
  "reviews": [
    {
      "id": 1,
      "reviewer_id": 456,
      "reviewer_username": "john_doe",
      "reviewer_name": "John Doe",
      "rating": 5,
      "review_text": "Excellent trainer!",
      "created_at": "2026-01-15 10:30:00",
      "updated_at": "2026-01-15 10:30:00"
    }
  ],
  "total_reviews": 45
}
```

---

### 3. Get My Review for Specific User
**Endpoint:** `GET /GetMyReview.php?reviewee_id=123`

Check if current user has already reviewed someone:

**Response:**
```json
{
  "success": true,
  "has_reviewed": true,
  "review": {
    "id": 789,
    "rating": 4,
    "review_text": "Good trainer",
    "created_at": "2026-01-10 14:20:00",
    "updated_at": "2026-01-15 09:45:00"
  }
}
```

---

### 4. Get Trainers with Ratings (Ranked)
**Endpoint:** `GET /GetTrainersWithRatings.php`

**Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Results per page
- `min_rating` (default: 0) - Minimum average rating filter
- `sort_by` (default: score) - Sorting method:
  - `score` - Quality score (best balance of rating × reviews)
  - `rating` - Highest average rating
  - `reviews` - Most reviews
  - `recent` - Most recently reviewed

**Response:**
```json
{
  "success": true,
  "trainers": [
    {
      "userid": 123,
      "username": "trainer_john",
      "full_name": "John Smith",
      "bio": "Certified personal trainer...",
      "review_count": 89,
      "average_rating": 4.72,
      "quality_score": 4.25,
      "five_star_count": 65,
      "four_star_count": 20,
      "three_star_count": 4,
      "two_star_count": 0,
      "one_star_count": 0
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_trainers": 97,
    "per_page": 20
  }
}
```

---

### 5. Delete Review
**Endpoint:** `DELETE /DeleteReview.php?review_id=123`

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

## Ranking Algorithm

### Quality Score Formula
```
quality_score = (average_rating × review_count) / (review_count + 10)
```

**Why this works:**
- Rewards high ratings AND high review count
- Prevents gaming: 1 review at 5 stars = 0.45 score
- Balances quality vs quantity: 100 reviews at 4 stars = 3.64 score (beats 1 at 5)
- The "+10" constant prevents new trainers from dominating
- As reviews increase, the score approaches the average rating

**Examples:**
- 1 review, 5 stars: score = 0.45
- 10 reviews, 5 stars: score = 2.50
- 50 reviews, 4.5 stars: score = 3.75
- 100 reviews, 4 stars: score = 3.64
- 200 reviews, 4.5 stars: score = 4.29

## Frontend Integration Examples

### Submit a Review
```javascript
const submitReview = async (traineeId, rating, reviewText) => {
  const response = await fetch(BACKEND_ROUTES_API + 'SubmitReview.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewee_id: traineeId,
      rating: rating,
      review_text: reviewText
    })
  });
  
  const result = await response.json();
  if (result.success) {
    console.log(result.action); // 'created' or 'updated'
  }
};
```

### Display Rating Stars
```javascript
const StarRating = ({ rating, count }) => {
  return (
    <div className="rating-display">
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <i key={star} className={
            star <= Math.round(rating) ? 'bi bi-star-fill' : 'bi bi-star'
          }></i>
        ))}
      </div>
      <span className="rating-text">{rating.toFixed(2)} ({count} reviews)</span>
    </div>
  );
};
```

### Load Trainers Ranked by Quality
```javascript
const loadTrainers = async (sortBy = 'score') => {
  const response = await fetch(
    `${BACKEND_ROUTES_API}GetTrainersWithRatings.php?sort_by=${sortBy}&page=1&limit=20`,
    { credentials: 'include' }
  );
  
  const data = await response.json();
  if (data.success) {
    setTrainers(data.trainers);
    setPagination(data.pagination);
  }
};
```

## Security Features

1. **Authentication Required** - All endpoints require active session
2. **Relationship Validation** - Can only review users with active coaching relationship
3. **Self-Review Prevention** - Cannot review yourself
4. **Ownership Validation** - Can only edit/delete your own reviews
5. **SQL Injection Protection** - All queries use prepared statements
6. **XSS Protection** - Review text should be sanitized on display

## Testing the System

Run the setup script:
```bash
php backend/src/routes/SetupReviewSystem.php
```

Test creating a review:
```bash
curl -X POST http://localhost/CoachFlow/backend/src/routes/SubmitReview.php \
  -H "Content-Type: application/json" \
  -d '{"reviewee_id": 123, "rating": 5, "review_text": "Great!"}'
```

## UI Components Needed

### For Trainees:
1. **Review Submission Modal** - Rate trainer after sessions
2. **Review Edit Form** - Update existing review
3. **Trainer Browse Page** - View trainers sorted by rating
4. **Trainer Profile** - Display reviews and stats

### For Trainers:
1. **Client Review Section** - Rate clients
2. **My Reviews Display** - See reviews received
3. **Review Response** (optional future feature)

### Shared Components:
1. **Star Rating Input** - 5-star selection interface
2. **Star Rating Display** - Show rating with count
3. **Review Card** - Display individual review
4. **Rating Distribution Chart** - Show 5/4/3/2/1 star breakdown

## Future Enhancements

1. **Review Responses** - Allow reviewees to respond to reviews
2. **Review Verification** - Mark verified reviews (completed sessions)
3. **Review Filtering** - Filter by rating, date, trainer specialization
4. **Review Reporting** - Flag inappropriate reviews
5. **Review Incentives** - Reward users for leaving reviews
6. **Photo Reviews** - Allow progress photos with reviews
7. **Trending Trainers** - Track trainers with improving ratings

## Migration Notes

If you have existing users, they will start with no reviews (0 rating, 0 count). As reviews accumulate, the quality score will naturally emerge based on actual user feedback.

The system is production-ready and handles all edge cases including:
- First-time reviews
- Review updates
- User deletions (cascading)
- Missing data (null-safe)
- Concurrent review submissions