import React from 'react';
import PropTypes from 'prop-types';

// Import the modernized ParticipantsTable with CQRS architecture
import ParticipantsTable from './ParticipantsTable.js';

/**
 * Main entry point for ParticipantsTable component
 * Now uses modern CQRS architecture with:
 * - RTK Query for data fetching and caching
 * - Semantic commands for business operations
 * - Domain events for cross-component communication
 * - Real-time updates without page reloads
 */
const ParticipantsTableContainer = ({ index }) => {
  return <ParticipantsTable index={index} />;
};

ParticipantsTableContainer.propTypes = {
  index: PropTypes.number,
};

export default ParticipantsTableContainer;