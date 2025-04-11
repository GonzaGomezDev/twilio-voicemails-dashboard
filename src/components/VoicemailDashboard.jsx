// components/VoicemailDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Actions, withTheme, IconButton, Manager, Template } from '@twilio/flex-ui';
import { Button, Card, Box, Heading, Paragraph, Badge, Stack, Tabs, Tab, TabList, TabPanels, TabPanel } from '@twilio-paste/core';
import { PlayIcon, RefreshIcon, CheckIcon, PhoneIcon } from '@twilio-paste/icons';
import styled from '@emotion/styled';

const DashboardContainer = styled(Box)`
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
`;

const VoicemailCard = styled(Card)`
  margin-bottom: 1rem;
  position: relative;
  background-color: ${props => props.isNew ? '#f0f7ff' : 'white'};
  border-left: ${props => props.isNew ? '4px solid #0263e0' : '4px solid #aaa'};
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin: 0.5rem 0;
`;

const TimeDisplay = styled(Paragraph)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #666;
  font-size: 0.85rem;
`;

const ActionButton = styled(Button)`
  margin-right: 0.5rem;
`;

const TranscriptionText = styled(Paragraph)`
  margin-top: 1rem;
  font-style: italic;
  color: #555;
  white-space: pre-wrap;
`;

const VoicemailDashboard = ({ syncClient, manager, theme }) => {
  const [voicemails, setVoicemails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [syncMap, setSyncMap] = useState(null);

  useEffect(() => {
    // Initialize the Sync Map
    const initSync = async () => {
      try {
        setIsLoading(true);
        
        // Get or create the Sync Map for voicemails
        const map = await syncClient.map('voicemail_tasks');
        setSyncMap(map);
        
        // Get all voicemails from the map
        const mapItems = await map.getItems();
        const voicemailItems = mapItems.items.map(item => item.data);
        setVoicemails(voicemailItems);
        
        // Listen for changes to the map
        map.on('itemAdded', event => {
          setVoicemails(current => [...current, event.item.data]);
        });
        
        map.on('itemRemoved', event => {
          setVoicemails(current => current.filter(vm => vm.taskSid !== event.key));
        });
        
        map.on('itemUpdated', event => {
          setVoicemails(current => 
            current.map(vm => vm.taskSid === event.key ? event.item.data : vm)
          );
        });
        
        // Also subscribe to TaskRouter events to update voicemail statuses
        manager.events.addListener('taskCanceled', handleTaskUpdate);
        manager.events.addListener('taskCompleted', handleTaskUpdate);
        manager.events.addListener('taskUpdated', handleTaskUpdate);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Sync:', error);
        setIsLoading(false);
      }
    };
    
    initSync();
    
    // Clean up listeners
    return () => {
      if (syncMap) {
        syncMap.removeAllListeners();
      }
      manager.events.removeListener('taskCanceled', handleTaskUpdate);
      manager.events.removeListener('taskCompleted', handleTaskUpdate);
      manager.events.removeListener('taskUpdated', handleTaskUpdate);
    };
  }, [syncClient]);

  // Handle task updates from TaskRouter
  const handleTaskUpdate = (task) => {
    const taskAttributes = task.attributes || {};
    
    // Only process voicemail tasks
    if (taskAttributes.taskType !== 'voicemail') {
      return;
    }
    
    // Update the voicemail in Sync
    if (syncMap) {
      if (task.status === 'completed') {
        // Mark as replied if completed
        syncMap.get(task.sid).then(item => {
          const updatedItem = {
            ...item.data,
            status: 'replied',
            repliedAt: new Date().toISOString(),
            repliedBy: manager.workerClient.name
          };
          syncMap.set(task.sid, updatedItem);
        }).catch(err => console.error('Error updating voicemail status:', err));
      } else {
        // Update other status changes
        syncMap.get(task.sid).then(item => {
          const updatedItem = {
            ...item.data,
            status: task.status
          };
          syncMap.set(task.sid, updatedItem);
        }).catch(err => {
          // Item might not exist yet, create it
          if (err.status === 404) {
            createVoicemailItem(task);
          } else {
            console.error('Error updating voicemail:', err);
          }
        });
      }
    }
  };

  // Create a new voicemail item in Sync
  const createVoicemailItem = (task) => {
    if (!syncMap) return;
    
    const attrs = task.attributes || {};
    
    const voicemailItem = {
      taskSid: task.sid,
      status: task.status || 'pending',
      from: attrs.from || 'Unknown',
      to: attrs.to || 'Unknown',
      recordingUrl: attrs.recordingUrl || attrs.voicemail?.recordingUrl,
      transcription: attrs.transcriptionText || attrs.voicemail?.transcriptionText || 'No transcription available',
      timestamp: task.dateCreated || new Date().toISOString(),
      repliedAt: null,
      repliedBy: null
    };
    
    syncMap.set(task.sid, voicemailItem)
      .catch(err => console.error('Error creating voicemail item:', err));
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Handle calling back the customer
  const handleCallBack = (voicemail) => {
    if (voicemail.from) {
      Actions.invokeAction('StartOutboundCall', { destination: voicemail.from });
    }
  };

  // Mark a voicemail as replied
  const markAsReplied = (voicemail) => {
    if (!syncMap) return;
    
    const updatedVoicemail = {
      ...voicemail,
      status: 'replied',
      repliedAt: new Date().toISOString(),
      repliedBy: manager.workerClient.name
    };
    
    syncMap.set(voicemail.taskSid, updatedVoicemail)
      .then(() => {
        // Also complete the task if it's still active
        Actions.invokeAction('CompleteTask', { sid: voicemail.taskSid })
          .catch(err => console.log('Task may already be completed:', err));
      })
      .catch(err => console.error('Error marking voicemail as replied:', err));
  };

  // Refresh the voicemail list
  const refreshVoicemails = async () => {
    if (!syncMap) return;
    
    setIsLoading(true);
    try {
      const mapItems = await syncMap.getItems();
      const voicemailItems = mapItems.items.map(item => item.data);
      setVoicemails(voicemailItems);
    } catch (error) {
      console.error('Error refreshing voicemails:', error);
    }
    setIsLoading(false);
  };

  // Filter voicemails based on selected tab
  const filteredVoicemails = voicemails.filter(vm => {
    if (selectedTab === 'pending') {
      return vm.status !== 'replied';
    } else if (selectedTab === 'replied') {
      return vm.status === 'replied';
    }
    return true;
  });

  return (
    <DashboardContainer>
      <Stack orientation="horizontal" spacing="space60">
        <Heading as="h1" variant="heading30">Voicemail Dashboard</Heading>
        <Button variant="secondary" size="circle" onClick={refreshVoicemails}>
          <RefreshIcon decorative={true} />
        </Button>
      </Stack>
      
      <Tabs selectedId={selectedTab} onSelect={setSelectedTab}>
        <TabList>
          <Tab id="pending">Pending ({voicemails.filter(vm => vm.status !== 'replied').length})</Tab>
          <Tab id="replied">Replied ({voicemails.filter(vm => vm.status === 'replied').length})</Tab>
          <Tab id="all">All ({voicemails.length})</Tab>
        </TabList>
        
        <TabPanels>
          {['pending', 'replied', 'all'].map(tabId => (
            <TabPanel key={tabId}>
              {isLoading ? (
                <Paragraph>Loading voicemails...</Paragraph>
              ) : filteredVoicemails.length === 0 ? (
                <Paragraph>No voicemails found.</Paragraph>
              ) : (
                filteredVoicemails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(voicemail => (
                  <VoicemailCard key={voicemail.taskSid} isNew={voicemail.status !== 'replied'}>
                    <Stack orientation="vertical" spacing="space30">
                      <Stack orientation="horizontal" spacing="space40">
                        <Badge as="span" variant={voicemail.status !== 'replied' ? 'new' : 'default'}>
                          {voicemail.status !== 'replied' ? 'New' : 'Replied'}
                        </Badge>
                        <Heading as="h3" variant="heading50">
                          From: {voicemail.from}
                        </Heading>
                      </Stack>
                      
                      <TimeDisplay>
                        {formatTime(voicemail.timestamp)}
                      </TimeDisplay>
                      
                      {voicemail.recordingUrl && (
                        <AudioPlayer controls>
                          <source src={voicemail.recordingUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </AudioPlayer>
                      )}
                      
                      {voicemail.transcription && (
                        <TranscriptionText>
                          "{voicemail.transcription}"
                        </TranscriptionText>
                      )}
                      
                      <Stack orientation="horizontal" spacing="space20">
                        <ActionButton variant="primary" onClick={() => handleCallBack(voicemail)}>
                          <PhoneIcon decorative={true} /> Call Back
                        </ActionButton>
                        
                        {voicemail.status !== 'replied' && (
                          <ActionButton variant="secondary" onClick={() => markAsReplied(voicemail)}>
                            <CheckIcon decorative={true} /> Mark as Replied
                          </ActionButton>
                        )}
                      </Stack>
                      
                      {voicemail.repliedAt && (
                        <Paragraph fontSize="fontSize20" color="colorTextWeak">
                          Replied by {voicemail.repliedBy} on {formatTime(voicemail.repliedAt)}
                        </Paragraph>
                      )}
                    </Stack>
                  </VoicemailCard>
                ))
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </DashboardContainer>
  );
};

export default withTheme(VoicemailDashboard);