/**
 * TrackStatus Page Component
 * Wraps PatientTracker for direct route or modular import usage
 */
import React from 'react';
import PatientTracker from '../components/PatientTracker';

export default function TrackStatus(props) {
  return <PatientTracker {...props} />;
}
