const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

// Set the port for testing
process.env.PORT = 3030;

describe('Company API Tests', () => {
  let testCompanyId;

  // Clean up database before and after tests
  beforeAll(async () => {
    // Clear the company table before tests
    await pool.query('DELETE FROM company');
  });

  afterAll(async () => {
    // Clean up after tests
    await pool.query('DELETE FROM company');
    await pool.end();
  });

  describe('POST /api/companies', () => {
    it('should create a new company with valid data', async () => {
      const companyData = {
        name: 'Test Company',
        description: 'A test company for testing',
        founded_year: 2020,
        industry: 'Technology',
        website: 'https://testcompany.com'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.description).toBe(companyData.description);
      expect(response.body.data.founded_year).toBe(companyData.founded_year);
      expect(response.body.data.industry).toBe(companyData.industry);
      expect(response.body.data.website).toBe(companyData.website);
      expect(response.body.data.id).toBeDefined();

      testCompanyId = response.body.data.id;
    });

    it('should create a company with only required fields', async () => {
      const companyData = {
        name: 'Minimal Company'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.founded_year).toBeNull();
      expect(response.body.data.industry).toBeNull();
      expect(response.body.data.website).toBeNull();
    });

    it('should return 400 when name is missing', async () => {
      const companyData = {
        description: 'A company without name'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Company name is required');
    });
  });

  describe('GET /api/companies', () => {
    it('should get all companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should get a company by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompanyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCompanyId);
      expect(response.body.data.name).toBe('Test Company');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/companies/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Company not found');
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update a company with valid data', async () => {
      const updateData = {
        name: 'Updated Test Company',
        description: 'Updated description',
        founded_year: 2021,
        industry: 'Updated Technology',
        website: 'https://updatedtestcompany.com'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompanyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.founded_year).toBe(updateData.founded_year);
      expect(response.body.data.industry).toBe(updateData.industry);
      expect(response.body.data.website).toBe(updateData.website);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        name: 'Partially Updated Company'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompanyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      // Other fields should remain unchanged
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/companies/99999')
        .send({ name: 'Non-existent' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Company not found');
    });
  });

  describe('GET /api/companies/search', () => {
    it('should search companies by name', async () => {
      const response = await request(app)
        .get('/api/companies/search?name=Updated')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return 400 when search term is missing', async () => {
      const response = await request(app)
        .get('/api/companies/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search term is required');
    });
  });

  describe('GET /api/companies/industry/:industry', () => {
    it('should get companies by industry', async () => {
      const response = await request(app)
        .get('/api/companies/industry/Technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete a company by ID', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompanyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCompanyId);
      expect(response.body.message).toBe('Company deleted successfully');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .delete('/api/companies/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Company not found');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
}); 