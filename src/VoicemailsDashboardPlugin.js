import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';
import VoicemailView from './components/VoicemailView';
import { VoicemailProvider } from './context/VoicemailContext';

const PLUGIN_NAME = 'VoicemailDashboardPlugin';

export default class VoicemailDashboardPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This method is called when your plugin is initialized
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    // Register the view first
    flex.ViewCollection.Content.add(
      <flex.View name="voicemail-view" key="voicemail-view">
        <VoicemailProvider>
          <VoicemailView key="voicemail-content" manager={manager} />
        </VoicemailProvider>
      </flex.View>
    );
    
    // Then add the navigation item that links to this view
    flex.SideNav.Content.add(
      <flex.SideLink
        key="voicemail-nav"
        icon="Audio"
        label="Voicemail"
        showLabel={true}
        onClick={() => flex.Actions.invokeAction('NavigateToView', { viewName: 'voicemail-view' })}
      />
    );
  }
}