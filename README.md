# Company CRUD API

A complete REST API for managing companies with PostgreSQL database, built with Node.js and Express.

## Features

- ✅ Complete CRUD operations for companies
- ✅ PostgreSQL database integration
- ✅ Input validation and error handling
- ✅ Search functionality
- ✅ Security middleware (Helmet, CORS, Rate Limiting)
- ✅ Comprehensive test suite
- ✅ API documentation

## Database Configuration

The API connects to a PostgreSQL database with the following configuration:
- **Host**: localhost
- **Port**: 5432
- **Database**: companies
- **User**: debuggeandoideas
- **Password**: udemy

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd company-crud-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Connect to your PostgreSQL container
   psql -h localhost -U debuggeandoideas -d companies
   
   # Run the SQL script
   \i database.sql
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3030`

## API Endpoints

### Base URL: `http://localhost:3030/api/companies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all companies |
| GET | `/:id` | Get company by ID |
| POST | `/` | Create new company |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Delete company |
| GET | `/search?name=term` | Search companies by name |
| GET | `/industry/:industry` | Get companies by industry |

### Request/Response Examples

#### Create Company
```bash
POST /api/companies
Content-Type: application/json

{
  "name": "New Company",
  "description": "A new company description",
  "founded_year": 2023,
  "industry": "Technology",
  "website": "https://newcompany.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "New Company",
    "description": "A new company description",
    "founded_year": 2023,
    "industry": "Technology",
    "website": "https://newcompany.com",
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:00Z"
  },
  "message": "Company created successfully"
}
```

#### Get All Companies
```bash
GET /api/companies
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Apple Inc.",
      "description": "Technology company...",
      "founded_year": 1976,
      "industry": "Technology",
      "website": "https://www.apple.com",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### Update Company
```bash
PUT /api/companies/1
Content-Type: application/json

{
  "name": "Updated Company Name",
  "industry": "Updated Industry"
}
```

#### Search Companies
```bash
GET /api/companies/search?name=Apple
```

#### Get Companies by Industry
```bash
GET /api/companies/industry/Technology
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite includes:
- ✅ CRUD operations testing
- ✅ Input validation testing
- ✅ Error handling testing
- ✅ Search functionality testing
- ✅ Health check testing

## Project Structure

```
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── companyController.js  # Company CRUD controllers
├── models/
│   └── Company.js           # Company model with database operations
├── routes/
│   └── companyRoutes.js     # API routes
├── tests/
│   └── company.test.js      # Test suite
├── database.sql             # Database schema and sample data
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request data validation
- **SQL Injection Protection**: Parameterized queries

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3030
NODE_ENV=development
```

## Database Schema

The `company` table has the following structure:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| founded_year | INTEGER | NULL |
| industry | VARCHAR(100) | NULL |
| website | VARCHAR(255) | NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License 