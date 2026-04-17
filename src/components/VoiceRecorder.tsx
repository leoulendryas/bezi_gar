'use client';

import React, { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onAudioSave: (audio: any) => void;
  isRawBlob?: boolean;
}

export default function VoiceRecorder({ onAudioSave, isRawBlob }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
        
        if (isRawBlob) {
          onAudioSave(audioBlob);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            onAudioSave(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {!isRecording ? (
        <button 
          className="button-outline" 
          onClick={startRecording}
          style={{ width: '100%', borderStyle: 'dashed' }}
        >
          ● Record Voice Note
        </button>
      ) : (
        <button 
          className="button" 
          onClick={stopRecording}
          style={{ width: '100%', background: '#000', color: '#fff' }}
        >
          Stop Recording
        </button>
      )}
      
      {audioURL && (
        <div style={{ marginTop: '1rem' }}>
          <audio src={audioURL} controls style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
