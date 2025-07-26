from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, parsers
from django.core.files.storage import default_storage
from django.conf import settings
import os
import ffmpeg
import openai
import tempfile

class MeetingUploadView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, format=None):
        video_file = request.FILES.get('file')
        if not video_file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save video file
        video_path = default_storage.save(f"videos/{video_file.name}", video_file)
        video_full_path = os.path.join(settings.MEDIA_ROOT, video_path)

        # Extract audio using ffmpeg
        audio_name = os.path.splitext(video_file.name)[0] + '.wav'
        audio_path = os.path.join(settings.MEDIA_ROOT, 'audio', audio_name)
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        (
            ffmpeg
            .input(video_full_path)
            .output(audio_path, acodec='pcm_s16le', ac=1, ar='16000')
            .overwrite_output()
            .run()
        )

        # Transcribe audio with Whisper (OpenAI)
        transcript = ''
        try:
            with open(audio_path, 'rb') as audio_file:
                transcript_response = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text",
                    language="hi"
                )
                transcript = transcript_response
        except Exception as e:
            return Response({'error': f'Whisper transcription failed: {str(e)}'}, status=500)

        # Summarize and extract tasks with GPT-4
        summary = ''
        tasks = []
        try:
            prompt = f"""
Summarize this meeting and extract a list of actionable tasks with deadlines and who they’re assigned to. Return the result as JSON with keys: summary, tasks (list of objects with task, description, owner, deadline).

Transcript:
{transcript}
"""
            chat_response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            content = chat_response.choices[0].message.content
            import json
            parsed = json.loads(content)
            summary = parsed.get('summary', '')
            tasks = parsed.get('tasks', [])
        except Exception as e:
            summary = "GPT-4 summarization failed."
            tasks = []

        return Response({
            "transcript": transcript,
            "summary": summary,
            "tasks": tasks
        }, status=200)

# Create your views here.
