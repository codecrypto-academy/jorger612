const express = require('express');
const router = express.Router();
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  searchCompanies,
  getCompaniesByIndustry
} = require('../controllers/companyController');

// GET /api/companies - Get all companies
router.get('/', getAllCompanies);

// GET /api/companies/search?name=term - Search companies by name
router.get('/search', searchCompanies);

// GET /api/companies/industry/:industry - Get companies by industry
router.get('/industry/:industry', getCompaniesByIndustry);

// GET /api/companies/:id - Get company by ID
router.get('/:id', getCompanyById);

// POST /api/companies - Create new company
router.post('/', createCompany);

// PUT /api/companies/:id - Update company
router.put('/:id', updateCompany);

// DELETE /api/companies/:id - Delete company
router.delete('/:id', deleteCompany);

module.exports = router; 