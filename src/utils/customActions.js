// utils/customActions.js
import { Actions, Manager } from '@twilio/flex-ui';

// Add a custom Action to mark voicemail as replied
Actions.registerAction('MarkVoicemailAsReplied', (payload, abortFunction) => {
  if (!payload.taskSid) {
    console.error('No taskSid provided to MarkVoicemailAsReplied action');
    return;
  }
  
  const manager = Manager.getInstance();
  const syncClient = manager.store.getState().syncClient;
  
  if (!syncClient) {
    console.error('Sync client not available');
    return;
  }
  
  // Update the Sync Map
  syncClient.map('voicemail_tasks')
    .then(map => {
      return map.get(payload.taskSid);
    })
    .then(item => {
      const updatedItem = {
        ...item.data,
        status: 'replied',
        repliedAt: new Date().toISOString(),
        repliedBy: manager.workerClient.name
      };
      
      return syncClient.map('voicemail_tasks').then(map => {
        return map.set(payload.taskSid, updatedItem);
      });
    })
    .then(() => {
      // Also complete the task if it's active
      const task = manager.store.getState().flex.worker.tasks.get(payload.taskSid);
      if (task) {
        Actions.invokeAction('CompleteTask', { sid: payload.taskSid });
      }
    })
    .catch(err => console.error('Error in MarkVoicemailAsReplied action:', err));
});

// Add reducer for storing the Sync client
if (!Manager.getInstance().store.addReducer) {
  // Register a reducer in older Flex versions
  Manager.getInstance().store.replaceReducer((state, action) => {
    if (action.type === 'SET_SYNC_CLIENT') {
      return {
        ...state,
        syncClient: action.payload
      };
    }
    return state;
  });
} else {
  // Use addReducer in newer Flex versions
  Manager.getInstance().store.addReducer('syncClient', (state = null, action) => {
    if (action.type === 'SET_SYNC_CLIENT') {
      return action.payload;
    }
    return state;
  });
}