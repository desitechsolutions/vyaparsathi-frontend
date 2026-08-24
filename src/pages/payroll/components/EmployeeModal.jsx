import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Box, Alert, Tab, Tabs, Button
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const EMPLOYMENT_STATUSES = ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'RESIGNED'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'];
const PT_STATES = ['MAHARASHTRA', 'KARNATAKA', 'TAMIL_NADU', 'DELHI', 'UTTAR_PRADESH'];
const TAX_REGIMES = ['NEW_REGIME', 'OLD_REGIME'];
const PAYMENT_PREFERENCES = ['BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE'];

function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeModal({ open, onClose, onSubmit, initialData, mode }) {
  const [tab, setTab] = useState(0);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset();
    }
  }, [initialData, open, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add New Employee' : 'Edit Employee'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="Basic Info" />
            <Tab label="Banking" />
            <Tab label="Statutory & Tax" />
          </Tabs>
        </Box>

        <form>
          {/* Tab 1: Basic Info */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="employeeCode"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Employee code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Employee Code"
                      error={!!errors.employeeCode}
                      helperText={errors.employeeCode?.message}
                      disabled={mode === 'edit'}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Last Name" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  defaultValue=""
                  rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Phone is required', pattern: { value: /^\d{10}$/, message: 'Phone must be 10 digits' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="gender"
                  control={control}
                  defaultValue="MALE"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Gender"
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="joiningDate"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Joining date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Joining Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.joiningDate}
                      helperText={errors.joiningDate?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="designation"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Designation" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="employmentType"
                  control={control}
                  defaultValue="FULL_TIME"
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Employment Type">
                      {EMPLOYMENT_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="employmentStatus"
                  control={control}
                  defaultValue="ACTIVE"
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Employment Status">
                      {EMPLOYMENT_STATUSES.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="monthlyCTC"
                  control={control}
                  defaultValue="0.00"
                  rules={{ min: { value: 10000, message: 'CTC must be at least ₹10,000' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Monthly CTC"
                      type="number"
                      error={!!errors.monthlyCTC}
                      helperText={errors.monthlyCTC?.message}
                      inputProps={{ min: 10000 }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Banking */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="paymentPreference"
                  control={control}
                  defaultValue="BANK_TRANSFER"
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Payment Preference">
                      {PAYMENT_PREFERENCES.map(pref => (
                        <MenuItem key={pref} value={pref}>{pref}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="bankAccountNumber"
                  control={control}
                  defaultValue=""
                  rules={{ pattern: { value: /^\d{9,18}$/, message: 'Account must be 9-18 digits' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Bank Account Number"
                      error={!!errors.bankAccountNumber}
                      helperText={errors.bankAccountNumber?.message}
                      inputProps={{ pattern: '[0-9]{9,18}' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="bankIFSCCode"
                  control={control}
                  defaultValue=""
                  rules={{ pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format (e.g., ICIC0000001)' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Bank IFSC Code"
                      error={!!errors.bankIFSCCode}
                      helperText={errors.bankIFSCCode?.message}
                      placeholder="e.g., ICIC0000001"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="bankName"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Bank Name" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="bankBeneficiaryName"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Beneficiary Name" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="upiId"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="UPI ID" />
                  )}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Statutory & Tax */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="panNumber"
                  control={control}
                  defaultValue=""
                  rules={{ pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="PAN Number"
                      error={!!errors.panNumber}
                      helperText={errors.panNumber?.message}
                      type="password"
                      autoComplete="off"
                      inputProps={{ maxLength: 10 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="aadhaarNumber"
                  control={control}
                  defaultValue=""
                  rules={{ pattern: { value: /^\d{12}$/, message: 'Aadhaar must be 12 digits' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Aadhaar Number"
                      error={!!errors.aadhaarNumber}
                      helperText={errors.aadhaarNumber?.message}
                      type="password"
                      autoComplete="off"
                      inputProps={{ maxLength: 12 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="uanNumber"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="UAN Number"
                      type="password"
                      autoComplete="off"
                      inputProps={{ maxLength: 12 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="esicNumber"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ESIC Number"
                      type="password"
                      autoComplete="off"
                      inputProps={{ maxLength: 17 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="ptState"
                  control={control}
                  defaultValue="MAHARASHTRA"
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="PT State">
                      {PT_STATES.map(state => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="taxRegime"
                  control={control}
                  defaultValue="NEW_REGIME"
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Tax Regime">
                      {TAX_REGIMES.map(regime => (
                        <MenuItem key={regime} value={regime}>{regime}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </TabPanel>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleFormSubmit)}
        >
          {mode === 'add' ? 'Add Employee' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}