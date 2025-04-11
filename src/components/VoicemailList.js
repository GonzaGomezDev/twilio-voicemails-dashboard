import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const VoicemailList = ({ 
  voicemails, 
  isLoading, 
  selectedId, 
  onSelect,
  pagination,
  onLoadMore
}) => {
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
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get relative time
  const getRelativeTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  if (isLoading && voicemails.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading voicemails...
      </div>
    );
  }

  if (voicemails.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        No voicemails found.
      </div>
    );
  }

  return (
    <div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {voicemails.map(voicemail => (
          <li 
            key={voicemail.id}
            onClick={() => onSelect(voicemail)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e1e3ea',
              cursor: 'pointer',
              backgroundColor: selectedId === voicemail.id ? '#f2f2f2' : 'transparent',
              position: 'relative'
            }}
          >
            {/* Status indicator */}
            {voicemail.status === 'new' && (
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '18px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#1976d2'
              }} />
            )}
            
            <div style={{ fontWeight: voicemail.status === 'new' ? 'bold' : 'normal' }}>
              <div style={{ marginBottom: '4px', marginLeft: '5px' }}>
                {formatPhone(voicemail.from_number)}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666'
              }}>
                {/* <span>{formatDuration(voicemail.recordingDuration)}</span> */}
                <span>{getRelativeTime(voicemail.timestamp)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {pagination.total > voicemails.length && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button 
            onClick={onLoadMore}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f2f2f2',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default VoicemailList;