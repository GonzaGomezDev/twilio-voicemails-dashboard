# Voicemails Dashboard Flex Plugin

This project is a custom [Twilio Flex](https://www.twilio.com/flex) plugin that adds a comprehensive Voicemails Dashboard to your Flex instance. It enables agents and supervisors to view, filter, listen to, and manage customer voicemails directly within the Flex UI.

## Features

- **Dashboard View:** Browse all voicemails with status indicators (new, read, replied).
- **Filtering:** Filter voicemails by status and phone number.
- **Detail View:** Listen to voicemail recordings, view transcriptions, and see metadata.
- **Actions:** Mark voicemails as read, replied, archived, or deleted. Initiate callback calls.
- **Sync Integration:** Uses Twilio Sync to keep voicemail data in real-time sync across users.
- **Pagination:** Load more voicemails as needed.
- **Custom Actions:** Integrates with Flex Actions framework for marking voicemails as replied and completing tasks.

## Architecture

The plugin is structured as follows:

- **React Components:**  
  - `VoicemailDashboard` ([src/components/VoicemailDashboard.jsx](src/components/VoicemailDashboard.jsx)): A dashboard UI for viewing and managing voicemails.
  - `VoicemailView`, `VoicemailList`, `VoicemailDetail`, `VoicemailFilters`: Modular components for listing, filtering, and displaying voicemail details.
- **Context API:**  
  - `VoicemailContext` ([src/context/VoicemailContext.js](src/context/VoicemailContext.js)): Provides voicemail data, filters, and actions to components using React Context.
- **Twilio Sync:**  
  - Voicemail data is stored and synchronized using a Twilio Sync Map (`voicemail_tasks`). The dashboard listens for Sync events to update the UI in real time.
- **Serverless Functions:**  
  - Voicemail retrieval and status updates are handled via Twilio Serverless endpoints (see `fetchVoicemails` and `updateVoicemailStatus` in [`VoicemailContext`](src/context/VoicemailContext.js)).
- **Flex Plugin Integration:**  
  - The plugin is registered in [`VoicemailsDashboardPlugin.js`](src/VoicemailsDashboardPlugin.js), adding a new view and navigation link to the Flex UI.
- **Custom Actions:**  
  - Actions such as "MarkVoicemailAsReplied" are registered in [`customActions.js`](src/utils/customActions.js) and interact with Sync and Flex Actions.

## Setup

Make sure you have [Node.js](https://nodejs.org) and [`npm`](https://npmjs.com). Install dependencies:

```bash
npm install
```

Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```bash
brew tap twilio/brew && brew install twilio
```

Install the [Flex Plugin extension](https://github.com/twilio-labs/plugin-flex/tree/v1-beta):

```bash
twilio plugins:install @twilio-labs/plugin-flex
```

## Development

Run `twilio flex:plugins --help` to see all supported commands. For more details, see the [Twilio Flex Plugin documentation](https://www.twilio.com/docs/flex/developer/plugins/cli).

---