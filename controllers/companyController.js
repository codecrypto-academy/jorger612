const Company = require('../models/Company');

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.getAll();
    res.json({
      success: true,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.getById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new company
const createCompany = async (req, res) => {
  try {
    const { name, description, founded_year, industry, website } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    const companyData = {
      name,
      description: description || null,
      founded_year: founded_year || null,
      industry: industry || null,
      website: website || null
    };
    
    const newCompany = await Company.create(companyData);
    
    res.status(201).json({
      success: true,
      data: newCompany,
      message: 'Company created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, founded_year, industry, website } = req.body;
    
    // Check if company exists
    const existingCompany = await Company.getById(id);
    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    const companyData = {
      name: name || existingCompany.name,
      description: description !== undefined ? description : existingCompany.description,
      founded_year: founded_year !== undefined ? founded_year : existingCompany.founded_year,
      industry: industry !== undefined ? industry : existingCompany.industry,
      website: website !== undefined ? website : existingCompany.website
    };
    
    const updatedCompany = await Company.update(id, companyData);
    
    res.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existingCompany = await Company.getById(id);
    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    const deletedCompany = await Company.delete(id);
    
    res.json({
      success: true,
      data: deletedCompany,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search companies by name
const searchCompanies = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    const companies = await Company.searchByName(name);
    
    res.json({
      success: true,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get companies by industry
const getCompaniesByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    
    const companies = await Company.getByIndustry(industry);
    
    res.json({
      success: true,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  searchCompanies,
  getCompaniesByIndustry
}; 