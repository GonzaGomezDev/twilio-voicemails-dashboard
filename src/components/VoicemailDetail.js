import React, { useState, useRef, useEffect } from 'react';
import { Actions, Manager } from '@twilio/flex-ui';
import { useVoicemail } from '../context/VoicemailContext';

const VoicemailDetail = ({ voicemail }) => {
  const { updateVoicemailStatus, setAudioPlaying } = useVoicemail();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(voicemail.recordingDuration || 0);
  
  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Strip any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  };
  
  // Format date
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
    setAudioPlaying(!isPlaying);
  };
  
  // Update progress when audio is playing
  const handleTimeUpdate = () => {
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration || audioDuration;
    setProgress((currentTime / duration) * 100);
  };
  
  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setAudioPlaying(false);
    
    // Mark as read if needed
    if (voicemail.status === 'new') {
      updateVoicemailStatus(voicemail.id, 'read');
    }
  };
  
  // Handle metadata loaded
  const handleMetadataLoaded = () => {
    if (audioRef.current.duration) {
      setAudioDuration(audioRef.current.duration);
    }
  };
  
  // Mark as read when component mounts if status is new
  useEffect(() => {
    if (voicemail.status === 'new') {
      updateVoicemailStatus(voicemail.id, 'read');
    }
  }, [voicemail.id]);

  // Handle calling the number
  const handleCall = () => {
    const manager = Manager.getInstance();
    
    Actions.invokeAction('StartOutboundCall', {
      destination: voicemail.from_number
    });
  };
  
  // Handle archive
  const handleArchive = () => {
    updateVoicemailStatus(voicemail.id, 'archived');
  };
  
  // Handle delete
  const handleDelete = () => {
    updateVoicemailStatus(voicemail.id, 'deleted');
  };

  const [audioUrl, setAudioUrl] = useState(null);

  useEffect(() => {
    const fetchAudio = async () => {
      setAudioUrl(null); // Reset audio URL before fetching new one
      try {
        const res = await fetch(`https://periwinkle-ladybird-6787.twil.io/fetch-voicemail-audio?recordingUrl=${encodeURIComponent(voicemail.recording_url)}`);
        const { audio, mimeType } = await res.json();
    
        // Decode base64 string
        const binaryString = atob(audio);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          byteArray[i] = binaryString.charCodeAt(i);
        }
    
        // Create blob and object URL
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
    
        setAudioUrl(url); // <- Ready to use in your <audio src={audioUrl} />
      } catch (err) {
        console.error('Failed to fetch audio:', err);
      }
    };
  
    fetchAudio();
  }, [voicemail.recording_url]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0' }}>Voicemail from {formatPhone(voicemail.from_number)}</h2>
        <p style={{ margin: '0 0 5px 0', color: '#666' }}>
          To: {formatPhone(voicemail.to_number)}
        </p>
        <p style={{ margin: '0', color: '#666' }}>
          Received: {formatDate(voicemail.timestamp)}
        </p>
      </div>
      
      <div style={{ 
        borderRadius: '8px', 
        padding: '16px 16px 16px 0',
        marginBottom: '20px'
      }}>
        {audioUrl ? (
          <audio controls src={audioUrl} />
        ) : (
          <p>Loading audio...</p>
        )}
      </div>
      
      {voicemail.transcription && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: '0' }}>Transcription</h3>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e1e3ea',
            borderRadius: '4px',
            padding: '16px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {voicemail.transcription}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={handleCall}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Call Back
        </button>
      </div>
    </div>
  );
};

export default VoicemailDetail;