# AI Meeting Assistant Backend (Django REST Framework)

This is the backend for the AI Meeting Assistant MVP. It provides an API for uploading meeting recordings, extracting audio, transcribing with Whisper, summarizing and extracting tasks with GPT-4, and storing media files.

## Features
- `/api/upload/` endpoint for video file upload (multipart/form-data)
- Extracts audio from video using ffmpeg
- Transcribes audio (Hindi/Hinglish) using OpenAI Whisper
- Summarizes and extracts tasks using GPT-4
- CORS enabled for frontend integration
- Media file storage in `media/` folder

## Setup
1. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```powershell
   pip install django djangorestframework django-cors-headers ffmpeg-python openai
   ```
3. Run migrations:
   ```powershell
   python manage.py migrate
   ```
4. Run the development server:
   ```powershell
   python manage.py runserver
   ```

## Environment Variables
- Set your OpenAI API key in your environment:
  ```powershell
  $env:OPENAI_API_KEY="sk-..."
  ```

## API Usage
- POST `/api/upload/` with a `.webm` video file as `file` in form-data.
- Response:
  ```json
  {
    "transcript": "...",
    "summary": "...",
    "tasks": [
      {"task": "Prepare proposal", "owner": "Jannat", "deadline": "2025-06-10"}
    ]
  }
  ```

## Notes
- ffmpeg must be installed and available in your system PATH.
- This backend is ready for integration with a React frontend.
