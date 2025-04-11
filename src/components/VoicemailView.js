import React, { useState } from 'react';
import { withTaskContext } from '@twilio/flex-ui';
import { useVoicemail } from '../context/VoicemailContext';
import VoicemailList from './VoicemailList';
import VoicemailDetail from './VoicemailDetail';
import VoicemailFilters from './VoicemailFilters';

const VoicemailView = ({ manager }) => {
  const { 
    voicemails,
    isLoading,
    error,
    currentVoicemail,
    setCurrentVoicemail,
    filters,
    setFilters,
    pagination,
    loadMore,
    refresh
  } = useVoicemail();
  
  // Handle selecting a voicemail
  const handleSelectVoicemail = (voicemail) => {
    setCurrentVoicemail(voicemail);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters, reload) => {
    setFilters(newFilters, reload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e1e3ea' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 16px 0' }}>Voicemails</h1>
        <VoicemailFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
      </div>
      
      {error && (
        <div style={{ padding: '10px 16px', color: 'red' }}>
          Error: {error}
          <button 
            onClick={refresh}
            style={{ marginLeft: '10px' }}
          >
            Try Again
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '350px', borderRight: '1px solid #e1e3ea', overflow: 'auto' }}>
          <VoicemailList 
            voicemails={voicemails}
            isLoading={isLoading}
            selectedId={currentVoicemail?.id}
            onSelect={handleSelectVoicemail}
            pagination={pagination}
            onLoadMore={loadMore}
          />
        </div>
        
        <div style={{ flex: 1, overflow: 'auto' }}>
          {currentVoicemail ? (
            <VoicemailDetail voicemail={currentVoicemail} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', marginLeft: '5px' }}>
              <p>Select a voicemail to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withTaskContext(VoicemailView);