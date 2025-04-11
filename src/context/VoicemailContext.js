import React, { createContext, useState, useEffect, useContext } from 'react';
import { Manager } from '@twilio/flex-ui';

const VoicemailContext = createContext();

export const VoicemailProvider = ({ children }) => {
  const [voicemails, setVoicemails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'new',
    phone: '',
    limit: 50,
    offset: 0,
    sortBy: 'timestamp',
    sortDirection: 'DESC'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });
  const [currentVoicemail, setCurrentVoicemail] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Get the current worker/agent ID from Flex
  const manager = Manager.getInstance();
  const workerId = manager.workerClient.sid;

  // Function to fetch voicemails
  const fetchVoicemails = async (customFilters = {}, reset = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Combine default filters with any custom filters
      const queryParams = {
        ...filters,
        ...customFilters
      };

      // Convert to URL search params
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });

      // The serverless function URL to fetch voicemails
      const functionUrl = `https://periwinkle-ladybird-6787.twil.io/voicemail-retrieval`;
      
      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voicemails');
      }

      const data = await response.json();
      
      if (reset) {
        setVoicemails(data.voicemails);
      } else {
        // Append new voicemails to the existing list
        setVoicemails((prevVoicemails) => [...prevVoicemails, ...data.voicemails]);
      }

      setPagination(data.pagination);
      
    } catch (err) {
      console.error('Error fetching voicemails:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a voicemail's status
  const updateVoicemailStatus = async (id, status) => {
    try {
      const functionUrl = `${process.env.REACT_APP_SERVERLESS_DOMAIN}/voicemail-status-update`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          status,
          agentId: workerId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update voicemail status');
      }

      // Refresh voicemails after updating
      await fetchVoicemails();
      
      // If we updated the currently selected voicemail, update that too
      if (currentVoicemail && currentVoicemail.id === id) {
        setCurrentVoicemail({
          ...currentVoicemail,
          status
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error updating voicemail status:', err);
      setError(err.message);
      return false;
    }
  };

  // Get voicemail by ID
  const getVoicemailById = async (id) => {
    try {
      const functionUrl = `${process.env.REACT_APP_SERVERLESS_DOMAIN}/voicemail-retrieval`;
      
      const response = await fetch(`${functionUrl}?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voicemail');
      }

      const data = await response.json();
      if (data.voicemails && data.voicemails.length > 0) {
        return data.voicemails[0];
      }
      
      throw new Error('Voicemail not found');
    } catch (err) {
      console.error('Error fetching voicemail by ID:', err);
      setError(err.message);
      return null;
    }
  };

  // Listen for new voicemails (could be implemented with websockets or polling)
  useEffect(() => {
    fetchVoicemails();
    
    // Set up polling for new voicemails every 30 seconds
    const interval = setInterval(() => {
      if (filters.status === 'new') {
        fetchVoicemails();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    voicemails,
    isLoading,
    error,
    filters,
    pagination,
    currentVoicemail,
    audioPlaying,
    setFilters: (newFilters, reset = false) => {
      const updatedFilters = { ...filters, ...newFilters, offset: 0 };
      setFilters(updatedFilters);
      fetchVoicemails(updatedFilters, reset);
    },
    updateVoicemailStatus,
    setCurrentVoicemail,
    getVoicemailById,
    setAudioPlaying,
    refresh: () => fetchVoicemails(),
    loadMore: () => {
      const newOffset = filters.offset + filters.limit;
      const updatedFilters = { ...filters, offset: newOffset };
      setFilters(updatedFilters);
      fetchVoicemails(updatedFilters);
    }
  };

  return (
    <VoicemailContext.Provider value={value}>
      {children}
    </VoicemailContext.Provider>
  );
};

export const useVoicemail = () => {
  const context = useContext(VoicemailContext);
  if (!context) {
    throw new Error('useVoicemail must be used within a VoicemailProvider');
  }
  return context;
};