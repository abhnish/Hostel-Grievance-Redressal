const { classifyText } = require('../services/aiService');
const { computePriorityScore } = require('../utils/priority');

describe('AI Service Classification', () => {
  // Mock process.env to test fallback behavior
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Remove GEMINI_API_KEY to test fallback
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Rule-based Fallback Classification', () => {
    test('should classify water supply complaints correctly', async () => {
      const result = await classifyText('There is a water leak in my area');
      
      expect(result).toHaveProperty('category', 'Water Supply');
      expect(result).toHaveProperty('urgency', 'low');
      expect(result).toHaveProperty('sentiment', 'neutral');
      expect(result).toHaveProperty('subcategory');
    });

    test('should classify road complaints correctly', async () => {
      const result = await classifyText('Big pothole on main street causing accidents');
      
      expect(result).toHaveProperty('category', 'Road');
      expect(result).toHaveProperty('urgency', 'low');
      expect(result).toHaveProperty('sentiment', 'neutral');
    });

    test('should classify electricity complaints correctly', async () => {
      const result = await classifyText('Power outage for 3 hours now');
      
      expect(result).toHaveProperty('category', 'Electricity');
      expect(result).toHaveProperty('urgency', 'medium');
      expect(result).toHaveProperty('sentiment', 'neutral');
    });

    test('should classify emergency complaints with high urgency', async () => {
      const result = await classifyText('Emergency at hospital - no power');
      
      expect(result).toHaveProperty('category', 'Electricity');
      expect(result).toHaveProperty('urgency', 'high');
      expect(result).toHaveProperty('sentiment', 'angry');
    });

    test('should classify angry sentiment correctly', async () => {
      const result = await classifyText('I am angry about this not working complaint');
      
      expect(result).toHaveProperty('sentiment', 'angry');
      expect(result).toHaveProperty('category', 'General');
    });

    test('should classify positive sentiment correctly', async () => {
      const result = await classifyText('Thank you for fixing the issue quickly');
      
      expect(result).toHaveProperty('sentiment', 'positive');
      expect(result).toHaveProperty('category', 'General');
    });

    test('should handle waste management complaints', async () => {
      const result = await classifyText('Garbage not collected for 2 weeks');
      
      expect(result).toHaveProperty('category', 'Waste Management');
      expect(result).toHaveProperty('urgency', 'medium');
      expect(result).toHaveProperty('sentiment', 'angry');
    });

    test('should handle health complaints', async () => {
      const result = await classifyText('Medical emergency at community center');
      
      expect(result).toHaveProperty('category', 'Health');
      expect(result).toHaveProperty('urgency', 'high');
    });

    test('should default to General for unknown categories', async () => {
      const result = await classifyText('Some random issue in the neighborhood');
      
      expect(result).toHaveProperty('category', 'General');
      expect(result).toHaveProperty('urgency', 'low');
      expect(result).toHaveProperty('sentiment', 'neutral');
    });

    test('should always return required keys', async () => {
      const result = await classifyText('Any complaint text');
      
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('subcategory');
      expect(result).toHaveProperty('urgency');
      expect(result).toHaveProperty('sentiment');
      
      // Check that urgency is one of expected values
      expect(['low', 'medium', 'high']).toContain(result.urgency);
      
      // Check that sentiment is one of expected values
      expect(['angry', 'neutral', 'positive']).toContain(result.sentiment);
    });
  });

  describe('Priority Score Computation', () => {
    test('should compute high priority for urgent angry complaints', () => {
      const score = computePriorityScore({
        urgency: 'high',
        sentiment: 'angry',
        recurrenceCount: 0,
        locationSensitivity: false
      });
      
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should compute medium priority for medium urgency', () => {
      const score = computePriorityScore({
        urgency: 'medium',
        sentiment: 'neutral',
        recurrenceCount: 1,
        locationSensitivity: false
      });
      
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(0.8);
    });

    test('should compute low priority for low urgency', () => {
      const score = computePriorityScore({
        urgency: 'low',
        sentiment: 'positive',
        recurrenceCount: 0,
        locationSensitivity: false
      });
      
      expect(score).toBeGreaterThan(0.2);
      expect(score).toBeLessThan(0.5);
    });

    test('should increase priority with recurrence count', () => {
      const baseScore = computePriorityScore({
        urgency: 'medium',
        sentiment: 'neutral',
        recurrenceCount: 0,
        locationSensitivity: false
      });

      const recurringScore = computePriorityScore({
        urgency: 'medium',
        sentiment: 'neutral',
        recurrenceCount: 3,
        locationSensitivity: false
      });
      
      expect(recurringScore).toBeGreaterThan(baseScore);
    });

    test('should increase priority for sensitive locations', () => {
      const normalScore = computePriorityScore({
        urgency: 'medium',
        sentiment: 'neutral',
        recurrenceCount: 0,
        locationSensitivity: false
      });

      const sensitiveScore = computePriorityScore({
        urgency: 'medium',
        sentiment: 'neutral',
        recurrenceCount: 0,
        locationSensitivity: true
      });
      
      expect(sensitiveScore).toBeGreaterThan(normalScore);
    });

    test('should normalize scores to 0-1 range', () => {
      const score = computePriorityScore({
        urgency: 'high',
        sentiment: 'angry',
        recurrenceCount: 10, // High recurrence
        locationSensitivity: true
      });
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
});
