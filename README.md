# AI Product Intelligence Platform

An AI-powered customer feedback analysis platform that transforms raw customer feedback into actionable product insights.

## Overview

The AI Product Intelligence Platform helps product teams analyze customer feedback at scale.

Users can upload a CSV file containing customer feedback, and the platform uses AI to identify sentiment, categories, recurring themes, product priorities, and recommended actions.

## Key Features

- CSV customer feedback upload
- AI-powered sentiment analysis
- Automatic feedback categorization
- AI theme detection and clustering
- Product issue prioritization
- Impact and effort assessment
- Recommended product actions
- AI-generated executive summary
- Top product issues overview
- Feedback Explorer
- Search and sentiment filtering
- Export analysis as JSON

## Product Workflow

```text
Customer Feedback CSV
        ↓
   Data Processing
        ↓
   AI Analysis
        ↓
 ┌─────────────────────┐
 │ Sentiment Analysis  │
 │ Categorization      │
 │ Theme Detection     │
 │ Prioritization      │
 └─────────────────────┘
        ↓
 Product Insights
        ↓
Recommended Actions
        ↓
 Executive Summary



Tech Stack

Frontend

* React
* Vite
* JavaScript
* CSS

Backend

* Python
* FastAPI
* Pandas
* Python dotenv

AI

* Google Gemini API
* Gemini 3.5 Flash Lite

Project Structure

ai-product-intelligence/
│
├── backend/
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

Getting Started

1. Clone the repository
git clone git@github.com:Sivabalaji06/ai-product-intelligence.git
cd ai-product-intelligence

2. Backend Setup
Create and activate a Python virtual environment:
python3 -m venv venv
source venv/bin/activate

Install the required packages:
pip install fastapi uvicorn pandas python-dotenv google-genai

Create:
backend/.env

Add your Gemini API key:
GEMINI_API_KEY=your_api_key_here

Start the backend:
cd backend
python3 -m uvicorn main:app --reload

The backend will run on:
http://localhost:8000

3. Frontend Setup

Open another terminal:
cd ai-product-intelligence/frontend
npm install
npm run dev

The frontend will run on:
http://localhost:5173

CSV Format

The platform accepts CSV files containing a customer feedback column.

Supported column names include:
feedback
text
review
comment
message

Example:
feedback
"The app crashes when I try to upload a file."
"The dashboard loads very slowly."
"I love the new interface."
"I cannot find the subscription cancellation option."

Example Product Insights

The platform can transform raw feedback into insights such as:

* Stability & Reliability Issues
* Billing & Subscription Management
* Performance & Speed
* Onboarding & Usability
* UI/UX & Design

Each prioritized theme includes:

* Priority
* Impact
* Effort
* Description
* Recommended action

Export

Analysis results can be exported as a JSON file containing:

* Executive summary
* Themes
* Product priorities
* Feedback analysis
* Sentiment
* Categories

Product Management Use Case

This project demonstrates how AI can support product managers by turning unstructured customer feedback into structured product intelligence.

Instead of manually reviewing hundreds of feedback entries, product teams can use the platform to identify recurring problems, understand customer sentiment, prioritize issues, and determine recommended actions.

Future Improvements

* User authentication
* Persistent analysis history
* Product analytics dashboard
* Trend analysis over time
* More advanced feedback clustering
* Integration with product management tools
* Real-time feedback ingestion
* Cloud deployment

Author

Sivabalaji

GitHub: https://github.com/Sivabalaji06
