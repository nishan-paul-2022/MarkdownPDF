# State Management for PDF Viewer Application

## Overview

This document outlines the requirements for implementing state management in our app. The goal is to track and persist user choices to provide a seamless viewing experience across different modes.

## Key User Choices to Track

### 1. View Mode
- Toggle between 'LIVE' and 'PRINT' modes.
- Current UI shows the mode selection mechanism.

### 2. Page Navigation
- **Current Page**: The page currently being viewed (e.g., page 1).
- **Total Pages**: The total number of pages in the document (e.g., 11 pages).

### 3. Zoom Controls
- **Zoom Percentage**: The current zoom level (e.g., 115%).
- **Fit to Page**: Option to fit the PDF to the page dimensions.
- **Fit to Width**: Option to fit the PDF to the width of the viewer.
- *Note*: These settings are stored separately for 'LIVE' and 'PRINT' modes.

### 4. Mode-Specific Preferences
- Each mode ('LIVE' and 'PRINT') maintains independent zoom settings.
- Upon switching modes, the application restores the last used settings for the selected mode.

### 5. UI Preferences
- Collapsed or expanded states for navigation panels and other UI elements.

## State Requirements

The state management solution must ensure:

- **Persistence**: User preferences are persisted separately for 'LIVE' and 'PRINT' modes.
- **Independence**: Zoom levels, fit options, and other settings are remembered independently for each mode.
- **Consistency**: The current page is maintained across mode switches.
- **Seamlessness**: Smooth transitions between modes without losing individual preferences.
- **Accessibility**: State is accessible throughout the application components.

## Implementation Guidelines

Provide a state management solution using your preferred library (e.g., React Context, Redux, Zustand) that includes:

- **Initial State Structure**: Define the state with separate configurations for 'LIVE' and 'PRINT' modes.
- **Actions/Methods**: Implement functions to update each state value (e.g., change mode, set zoom, navigate pages).
- **Mode Switching Logic**: Handle transitions between modes while preserving individual preferences.
- **Selectors**: Provide methods to retrieve current mode-specific settings.
- **TypeScript Types**: Include proper type definitions for type safety (if applicable)."
