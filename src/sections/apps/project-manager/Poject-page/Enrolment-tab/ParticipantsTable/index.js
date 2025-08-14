import React from 'react';
import PropTypes from 'prop-types';

// Project imports
import ParticipantsTable from './ParticipantsTable';

/**
 * Main entry point for ParticipantsTable component
 * This wrapper maintains backward compatibility while using the new optimized structure
 */
const ParticipantsTableContainer = ({ index }) => {
  return <ParticipantsTable index={index} />;
};

ParticipantsTableContainer.propTypes = {
  index: PropTypes.number,
};

export default ParticipantsTableContainer;