const pool = require('../config/database');

class Company {
  // Get all companies
  static async getAll() {
    try {
      const result = await pool.query('SELECT * FROM company ORDER BY id');
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting companies: ${error.message}`);
    }
  }

  // Get company by ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM company WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting company: ${error.message}`);
    }
  }

  // Create new company
  static async create(companyData) {
    try {
      const { name, description, founded_year, industry, website } = companyData;
      const result = await pool.query(
        'INSERT INTO company (name, description, founded_year, industry, website) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, founded_year, industry, website]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating company: ${error.message}`);
    }
  }

  // Update company
  static async update(id, companyData) {
    try {
      const { name, description, founded_year, industry, website } = companyData;
      const result = await pool.query(
        'UPDATE company SET name = $1, description = $2, founded_year = $3, industry = $4, website = $5 WHERE id = $6 RETURNING *',
        [name, description, founded_year, industry, website, id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating company: ${error.message}`);
    }
  }

  // Delete company
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM company WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting company: ${error.message}`);
    }
  }

  // Search companies by name
  static async searchByName(name) {
    try {
      const result = await pool.query(
        'SELECT * FROM company WHERE name ILIKE $1 ORDER BY name',
        [`%${name}%`]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching companies: ${error.message}`);
    }
  }

  // Get companies by industry
  static async getByIndustry(industry) {
    try {
      const result = await pool.query(
        'SELECT * FROM company WHERE industry ILIKE $1 ORDER BY name',
        [`%${industry}%`]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting companies by industry: ${error.message}`);
    }
  }
}

module.exports = Company; 