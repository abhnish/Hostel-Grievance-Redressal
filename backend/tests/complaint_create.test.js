const request = require('supertest');
const express = require('express');
const { classifyText } = require('../services/aiService');
const { computePriorityScore } = require('../utils/priority');

// Mock the database
jest.mock('../db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock AI service
jest.mock('../services/aiService', () => ({
  classifyText: jest.fn()
}));

// Mock priority utility
jest.mock('../utils/priority', () => ({
  computePriorityScore: jest.fn()
}));

// Mock the decodeUser function and auth
jest.mock('../controller/complaintController', () => {
  const originalModule = jest.requireActual('../controller/complaintController');
  return {
    ...originalModule,
    postComplaints: jest.fn()
  };
});

const app = express();
app.use(express.json());

// Import after mocking
const { postComplaints } = require('../controller/complaintController');

// Set up routes
app.post('/complaints', postComplaints);

describe('Complaint Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create complaint with AI classification and priority', async () => {
    // Mock AI classification
    const mockClassification = {
      category: 'Water Supply',
      subcategory: 'Leak',
      urgency: 'medium',
      sentiment: 'angry'
    };
    classifyText.mockResolvedValue(mockClassification);

    // Mock priority computation
    const mockPriorityScore = 0.85;
    computePriorityScore.mockReturnValue(mockPriorityScore);

    // Mock database insert
    const mockDbResult = {
      rows: [{
        id: 1,
        citizen_id: 123,
        ward_id: 1,
        description: 'Water leak in main pipe',
        category: 'Water Supply',
        sentiment: 'angry',
        priority_score: 0.85,
        status: 'pending',
        created_at: new Date().toISOString()
      }]
    };
    const { pool } = require('../db');
    pool.query.mockResolvedValue(mockDbResult);

    // Mock recurrence count query
    pool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });

    const complaintData = {
      citizen_id: 123,
      ward_id: 1,
      department_id: 2,
      description: 'Water leak in main pipe',
      location: 'Main Street',
      latitude: 40.7128,
      longitude: -74.0060
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(200);

    expect(response.body).toEqual(mockDbResult.rows[0]);
    expect(classifyText).toHaveBeenCalledWith('Water leak in main pipe');
    expect(computePriorityScore).toHaveBeenCalledWith({
      urgency: 'medium',
      sentiment: 'angry',
      recurrenceCount: 2,
      locationSensitivity: false
    });

    // Verify database was called with correct parameters
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO complaint'),
      expect.arrayContaining([
        123, // citizen_id
        1,   // ward_id
        2,   // department_id
        'Water leak in main pipe', // description
        'Main Street', // location
        40.7128, // latitude
        -74.0060, // longitude
        'Water Supply', // category
        'angry', // sentiment
        0.85, // priority_score
        'pending', // status
        expect.any(String) // created_at
      ])
    );
  });

  test('should return 400 when description is missing', async () => {
    const { pool } = require('../db');
    pool.query.mockResolvedValue({ rows: [] });

    const complaintData = {
      citizen_id: 123,
      ward_id: 1,
      // description missing
      location: 'Main Street'
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(400);

    expect(response.body).toEqual({ error: 'Description and ward_id are required' });
  });

  test('should return 400 when ward_id is missing', async () => {
    const { pool } = require('../db');
    pool.query.mockResolvedValue({ rows: [] });

    const complaintData = {
      citizen_id: 123,
      description: 'Water leak',
      // ward_id missing
      location: 'Main Street'
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(400);

    expect(response.body).toEqual({ error: 'Description and ward_id are required' });
  });

  test('should handle AI service errors gracefully', async () => {
    // Mock AI service to throw error
    classifyText.mockRejectedValue(new Error('AI service failed'));

    const { pool } = require('../db');
    pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] }); // recurrence count
    pool.query.mockResolvedValue({ rows: [{ id: 1, priority_score: 0.3 }] }); // insert

    const complaintData = {
      citizen_id: 123,
      ward_id: 1,
      description: 'Test complaint',
      location: 'Test location'
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(200);

    expect(classifyText).toHaveBeenCalled();
    expect(response.body).toHaveProperty('priority_score');
  });

  test('should compute priority score > 0 for valid complaints', async () => {
    const mockClassification = {
      category: 'Road',
      urgency: 'high',
      sentiment: 'angry'
    };
    classifyText.mockResolvedValue(mockClassification);

    const mockPriorityScore = 0.95;
    computePriorityScore.mockReturnValue(mockPriorityScore);

    const { pool } = require('../db');
    pool.query.mockResolvedValueOnce({ rows: [{ count: '3' }] }); // recurrence count
    pool.query.mockResolvedValue({ rows: [{ id: 1, priority_score: 0.95 }] });

    const complaintData = {
      citizen_id: 123,
      ward_id: 1,
      description: 'Emergency road repair needed',
      location: 'Highway'
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(200);

    expect(response.body.priority_score).toBeGreaterThan(0);
    expect(response.body.priority_score).toBe(0.95);
  });

  test('should handle database errors gracefully', async () => {
    classifyText.mockResolvedValue({
      category: 'General',
      urgency: 'low',
      sentiment: 'neutral'
    });

    const { pool } = require('../db');
    pool.query.mockRejectedValue(new Error('Database connection failed'));

    const complaintData = {
      citizen_id: 123,
      ward_id: 1,
      description: 'Test complaint',
      location: 'Test location'
    };

    const response = await request(app)
      .post('/complaints')
      .set('Authorization', 'mock-token')
      .send(complaintData)
      .expect(500);

    expect(response.body).toEqual({ error: 'Server error' });
  });
});
