import React, { useState, useEffect } from 'react';
import {
  Box, MenuItem, Stepper, Step, StepLabel, Button, Card, CardContent,
  Stack, Alert, Snackbar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import * as api from '../../services/api';

import Step1Attendance from './wizard/Step1Attendance';
import Step2Earnings from './wizard/Step2Earnings';
import Step3Deductions from './wizard/Step3Deductions';
import Step4Review from './wizard/Step4Review';
import Step5Disbursal from './wizard/Step5Disbursal';

const STEPS = ['Attendance & LOP', 'Earnings & Bonuses', 'Deductions & Tax', 'Review & Impact', 'Disbursal'];

export default function PayrollWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [showInitDialog, setShowInitDialog] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Shared state across all steps
  const [payrollData, setPayrollData] = useState({
    payrollRun: null,
    attendanceData: [],
    earningsData: {},
    deductionsData: {},
    reviewData: {},
    disbursalData: {},
  });

  // Initialize payroll run
  const handleInitPayrollRun = async () => {
    try {
      setLoading(true);
      const response = await api.createPayrollRun(String(month).padStart(2, '0'), year);
      setPayrollData({
        ...payrollData,
        payrollRun: response
      });
      setShowInitDialog(false);
      setToast({ open: true, message: 'Payroll run initialized. Proceed to attendance.', severity: 'success' });
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to create payroll run',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate current step before moving forward
    if (activeStep === 0 && (!payrollData.attendanceData || payrollData.attendanceData.length === 0)) {
      setToast({ open: true, message: 'Please complete attendance data before proceeding', severity: 'error' });
      return;
    }
    if (activeStep === 3 && (!payrollData.payrollRun || !payrollData.payrollRun.id)) {
      setToast({ open: true, message: 'Payroll run not initialized', severity: 'error' });
      return;
    }
    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepDataUpdate = (stepData) => {
    setPayrollData({
      ...payrollData,
      ...stepData,
    });
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      const runId = payrollData.payrollRun?.id;

      // Step 1: Process payroll run (calculate all slips)
      await api.markPayrollRunAsProcessing(runId);

      // Step 2: Approve payroll run
      await api.approvePayrollRun(runId, null);

      // Step 3: Disburse payroll run
      await api.disbursePayrollRun(runId, null);

      setToast({ open: true, message: 'Payroll run processed and disbursed successfully', severity: 'success' });

      // Reset wizard
      setTimeout(() => {
        setActiveStep(0);
        setShowInitDialog(true);
        setPayrollData({
          payrollRun: null,
          attendanceData: [],
          earningsData: {},
          deductionsData: {},
          reviewData: {},
          disbursalData: {},
        });
      }, 2000);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to process payroll',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Initialize Dialog */}
      <Dialog open={showInitDialog} onClose={() => setShowInitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Payroll Run</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              fullWidth
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <MenuItem key={i} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              fullWidth
            >
              {[year - 1, year, year + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInitDialog(false)}>Cancel</Button>
          <Button onClick={handleInitPayrollRun} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Run'}
          </Button>
        </DialogActions>
      </Dialog>

      <h2>Monthly Payroll Run {payrollData.payrollRun && `(${payrollData.payrollRun.runNumber})`}</h2>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4, pt: 2 }}>
        {STEPS.map((label, index) => (
          <Step key={label} completed={activeStep > index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card sx={{ mb: 3, minHeight: '400px' }}>
        <CardContent>
          {activeStep === 0 && (
            <Step1Attendance
              data={payrollData.attendanceData}
              payrollRun={payrollData.payrollRun}
              onDataChange={(data) => handleStepDataUpdate({ attendanceData: data })}
            />
          )}

          {activeStep === 1 && (
            <Step2Earnings
              data={payrollData.earningsData}
              onDataChange={(data) => handleStepDataUpdate({ earningsData: data })}
            />
          )}

          {activeStep === 2 && (
            <Step3Deductions
              data={payrollData.deductionsData}
              onDataChange={(data) => handleStepDataUpdate({ deductionsData: data })}
            />
          )}

          {activeStep === 3 && (
            <Step4Review
              payrollData={payrollData}
              onDataChange={(data) => handleStepDataUpdate({ reviewData: data })}
            />
          )}

          {activeStep === 4 && (
            <Step5Disbursal
              payrollData={payrollData}
              onDataChange={(data) => handleStepDataUpdate({ disbursalData: data })}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
        >
          Back
        </Button>

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Disburse & Finish'}
          </Button>
        )}
      </Stack>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}