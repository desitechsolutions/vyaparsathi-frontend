import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  TimelineConnector as TimelineConnectorMUI,
} from '@mui/lab';
import { Chip, Typography, Box, Avatar } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CallMadeIcon from '@mui/icons-material/CallMade';
import PendingIcon from '@mui/icons-material/Pending';

const ApprovalTimeline = ({ timeline = [] }) => {
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'REJECTED':
        return <CancelIcon sx={{ color: '#f44336' }} />;
      case 'ESCALATED':
        return <CallMadeIcon sx={{ color: '#ff9800' }} />;
      case 'PENDING':
        return <PendingIcon sx={{ color: '#2196f3' }} />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'ESCALATED':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">No approval history</Typography>
      </Box>
    );
  }

  return (
    <Timeline position="alternate">
      {timeline.map((item, index) => (
        <TimelineItem key={item.id || index}>
          <TimelineOppositeContent color="textSecondary" sx={{ flex: 0.3 }}>
            <Typography variant="caption">
              Level {item.level}
            </Typography>
            <Typography variant="caption" display="block">
              {item.actionDate ? new Date(item.actionDate).toLocaleDateString() : 'Pending'}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {getStatusIcon(item.status)}
            </Avatar>
            {index < timeline.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{ flex: 0.7 }}>
            <Box>
              <Chip
                label={item.status || 'PENDING'}
                color={getStatusColor(item.status)}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {item.approverId || 'Awaiting'}
            </Typography>
            {item.comment && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                {item.comment}
              </Typography>
            )}
            {item.rejectionReason && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                Reason: {item.rejectionReason}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default ApprovalTimeline;
