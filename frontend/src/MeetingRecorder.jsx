import React, { useRef, useState } from 'react';

const MeetingRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const fileInputRef = useRef();

  const startRecording = async () => {
    setUploadResult(null);
    setSelectedFileName('');
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();
      // Only add screen audio if it exists
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudio = context.createMediaStreamSource(new MediaStream([screenAudioTracks[0]]));
        screenAudio.connect(destination);
      }
      // Always add mic audio
      const micAudioTracks = micStream.getAudioTracks();
      if (micAudioTracks.length > 0) {
        const micAudio = context.createMediaStreamSource(new MediaStream([micAudioTracks[0]]));
        micAudio.connect(destination);
      }
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ];
      const mixedStream = new MediaStream(tracks);
      mediaRecorderRef.current = new window.MediaRecorder(mixedStream, { mimeType: 'video/webm; codecs=vp8,opus' });
      recordedChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        setMediaBlob(blob);
        setMediaUrl(URL.createObjectURL(blob));
        setSelectedFileName('meeting.webm');
        screenStream.getTracks().forEach((t) => t.stop());
        micStream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert('Error starting recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadRecording = async () => {
    if (!mediaBlob) return;
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', mediaBlob, 'meeting.webm');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (err) {
      setUploadResult({ error: err.message });
    }
    setUploading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setMediaBlob(file);
    setMediaUrl(URL.createObjectURL(file));
    setUploadResult(null);
  };

  const handleGalleryUpload = async () => {
    if (!mediaBlob) return;
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', mediaBlob, selectedFileName || 'meeting.webm');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (err) {
      setUploadResult({ error: err.message });
    }
    setUploading(false);
  };

  return (
    <div style={{ minHeight: '100vh', width:'100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 1200, width: '100%', padding: 0, background: '#f9fafb', borderRadius: 18, boxShadow: '0 4px 24px #0002', fontFamily: 'Segoe UI, Arial, sans-serif', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '32px 32px 16px 32px', borderBottom: '1px solid #e5e7eb', background: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28, color: '#1a202c', textAlign: 'center', letterSpacing: '-1px' }}>
            <span role="img" aria-label="video">🎥</span> AI Meeting Assistant
          </h1>
          <p style={{ color: '#374151', fontSize: 16, margin: '18px 0 0 0', textAlign: 'left', lineHeight: 1.6 }}>
            <b>How it works:</b> <br />
            <span style={{ color: '#4b5563', fontWeight: 400 }}>
              Record your meeting (screen + mic) or upload a video file. The assistant will extract audio, transcribe speech (Hindi/Hinglish supported), summarize the meeting, and extract actionable tasks with deadlines and owners using AI.<br />
              <span style={{ color: '#2563eb', fontWeight: 500 }}>No data is stored permanently. All processing is automatic and secure.</span>
            </span>
          </p>
        </div>
        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={startRecording} disabled={recording || uploading} style={{ padding: '10px 10px', fontWeight: 500, background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, cursor: recording || uploading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001' }}>
                <span role="img" aria-label="record">⏺️</span> Start Recording
              </button>
              <button onClick={stopRecording} disabled={!recording || uploading} style={{ padding: '10px 20px', fontWeight: 500, background: '#ef4444', color: '#fff', border: 0, borderRadius: 6, cursor: !recording || uploading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001' }}>
                <span role="img" aria-label="stop">⏹️</span> Stop
              </button>
              <button onClick={uploadRecording} disabled={!mediaBlob || uploading || recording} style={{ padding: '10px 20px', fontWeight: 500, background: '#059669', color: '#fff', border: 0, borderRadius: 6, cursor: !mediaBlob || uploading || recording ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001' }}>
                <span role="img" aria-label="upload">⬆️</span> Upload Recording
              </button>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploading || recording}
                style={{ padding: '10px 20px', fontWeight: 500, background: '#f59e42', color: '#fff', border: 0, borderRadius: 6, cursor: uploading || recording ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001' }}
              >
                <span role="img" aria-label="gallery">🖼️</span> Choose from Gallery
              </button>
              <button
                onClick={handleGalleryUpload}
                disabled={!mediaBlob || uploading || recording || selectedFileName === 'meeting.webm'}
                style={{ padding: '10px 20px', fontWeight: 500, background: '#059669', color: '#fff', border: 0, borderRadius: 6, cursor: !mediaBlob || uploading || recording || selectedFileName === 'meeting.webm' ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001' }}
              >
                <span role="img" aria-label="upload">⬆️</span> Upload Selected File
              </button>
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            
          </div>
          {mediaUrl && (
            <div style={{ marginBottom: 18, textAlign: 'center' }}>
              <video src={mediaUrl} controls style={{ width: '100%', borderRadius: 10, boxShadow: '0 2px 12px #0002' }} />
            </div>
          )}
          {uploading && (
            <div style={{ textAlign: 'center', color: '#2563eb', marginBottom: 12, fontWeight: 500, fontSize: 16 }}>
              <span role="img" aria-label="hourglass">⏳</span> Uploading...
            </div>
          )}
          {uploadResult && (
            <div style={{ background: '#f1f5f9', padding: 18, borderRadius: 10, marginTop: 8, fontSize: 15, border: '1px solid #e5e7eb' }}>
              {uploadResult.summary && (
                <div style={{ margin: '16px 0', padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', border: '1px solid #e0e7ef' }}>
                  <div style={{ fontWeight: 600, fontSize: 17, color: '#2563eb', marginBottom: 6 }}>Meeting Summary</div>
                  <div style={{ color: '#334155', fontSize: 15 }}>{uploadResult.summary}</div>
                </div>
              )}
              {uploadResult.tasks && Array.isArray(uploadResult.tasks) && uploadResult.tasks.length > 0 && (
                <div style={{ margin: '18px 0 0 0' }}>
                  <div style={{ fontWeight: 600, fontSize: 17, color: '#059669', marginBottom: 6 }}>Actionable Tasks</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', fontSize: 15 }}>
                      <thead>
                        <tr style={{ background: '#e0e7ef', color: '#2563eb' }}>
                          <th style={{ width: '72%', padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Task</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Owner</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.tasks.map((task, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                              <div>{task.task}</div>
                              {task.description && (
                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{task.description}</div>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{task.owner}</td>
                            <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{task.deadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {uploadResult.transcript && (
                <details style={{ marginTop: 18 }}>
                  <summary style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 500 }}>Show Transcript</summary>
                  <pre style={{ margin: 0, fontSize: 13, color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>{uploadResult.transcript}</pre>
                </details>
              )}
              {uploadResult.error && (
                <div style={{ color: '#ef4444', marginTop: 12, fontWeight: 500 }}>{uploadResult.error}</div>
              )}
            </div>
          )}
          <div style={{ marginTop: 32, textAlign: 'center', color: '#64748b', fontSize: 14, background: '#f3f4f6', borderRadius: 8, padding: 12, border: '1px solid #e5e7eb' }}>
            <span role="img" aria-label="info">ℹ️</span> <b>Workflow:</b> <br />
            <ol style={{ textAlign: 'left', margin: '8px auto 0 auto', maxWidth: 400, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
              <li>Click <b>Start Recording</b> to capture your screen and mic, or <b>Choose from Gallery</b> to select a video file.</li>
              <li>Stop the recording when done, then <b>Upload Recording</b> or <b>Upload Selected File</b>.</li>
              <li>The assistant will process your video and return a transcript, summary, and actionable tasks.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRecorder;
