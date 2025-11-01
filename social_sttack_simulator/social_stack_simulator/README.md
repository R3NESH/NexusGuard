# Social Stack Simulator

A full-stack web application for managing student opportunities with a focus on cybersecurity awareness and phishing simulation.

## Project Structure

```
social_stack_simulator/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── pages/          # Page components
│       │   ├── AdminDashboard.jsx
│       │   ├── ApplicationForm.jsx
│       │   └── MainPage.jsx
│       └── App.js          # Main application component
└── server/                 # Backend Flask application
    ├── app.py             # Main Flask application
    ├── requirements.txt    # Python dependencies
    └── .env               # Environment variables
```

## Prerequisites

- Node.js (v14 or later)
- Python (v3.8 or later)
- npm or yarn
- pip

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create and activate a virtual environment (Windows):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the server directory with the following content:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   N8N_WEBHOOK_URL=your_webhook_url
   FLASK_APP=app.py
   FLASK_ENV=development
   ```

5. Run the Flask server:
   ```bash
   python app.py
   ```
   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## Features

- **Student Application Form**: Secure form for students to apply for opportunities
- **Admin Dashboard**: View and manage student applications
- **Phishing Simulation**: Generate realistic phishing emails for security training
- **Risk Scoring**: Track and score student security awareness
- **Data Export**: Export student data to CSV

## API Endpoints

- `GET /api/students-data` - Get all student applications
- `POST /api/students-data` - Submit a new application
- `POST /api/generate-phishing` - Generate a phishing email
- `GET /api/leaderboard` - Get the security awareness leaderboard
- `POST /api/clear-students-data` - Clear all student data (admin only)
- `GET /api/export-students-data` - Export student data to CSV

## Security Considerations

- API keys and sensitive information are stored in environment variables
- CORS is properly configured for the frontend
- Input validation is implemented on both client and server
- Database queries use parameterized statements to prevent SQL injection

## License

This project is licensed under the MIT License.
