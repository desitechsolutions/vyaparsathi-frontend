import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Storefront,
  CloudUpload,
  AccountBalance,
  ReceiptLong,
  ColorLens,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { fetchShop, fetchFileBlob } from "../services/api";
import API from "../services/api";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const initialDataRef = useRef(null);

  const [shopData, setShopData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    isCompositionScheme: false,
    brandColor: "#2980b9",
    bankDetails: "",
    termsAndConditions: "",
    logoPath: "",
    signaturePath: "",
    drugLicenseNumber: "",
    industryType: "",
  });

  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({ logo: null, signature: null });
  const [secureUrls, setSecureUrls] = useState({ logo: "", signature: "" });

  // -------------------- SECURE IMAGE LOADING --------------------
  const loadSecureImage = async (path, type) => {
    if (!path || path.startsWith('blob')) return;
    
    let cleanPath = path;
    if (path.startsWith('http')) {
        if (path.includes('/uploads/')) {
            cleanPath = path.split('/uploads/')[1]; 
        } else {
            return; 
        }
    }

    try {
      const response = await fetchFileBlob(cleanPath);
      const url = URL.createObjectURL(response.data);
      setSecureUrls(prev => ({ ...prev, [type]: url }));
    } catch (err) {
      console.error(`Error loading secure ${type}:`, err);
    }
  };

  useEffect(() => {
    if (shopData.logoPath) loadSecureImage(shopData.logoPath, 'logo');
  }, [shopData.logoPath]);

  useEffect(() => {
    if (shopData.signaturePath) loadSecureImage(shopData.signaturePath, 'signature');
  }, [shopData.signaturePath]);

  useEffect(() => {
    return () => {
      if (secureUrls.logo) URL.revokeObjectURL(secureUrls.logo);
      if (secureUrls.signature) URL.revokeObjectURL(secureUrls.signature);
    };
  }, [secureUrls]);

  const getDisplayUrl = (type) => {
    return previews[type] || secureUrls[type];
  };

  // -------------------- IMAGE COMPRESSION LOGIC --------------------
  const compressImage = (file, maxWidth = 500, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Compression failed"));
              }
            },
            "image/jpeg",
            quality
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // -------------------- CORE LOGIC --------------------
  useEffect(() => {
    loadShopDetails();
  }, []);

  const loadShopDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchShop();
      if (res.data) {
        const data = {
          ...res.data,
          name: res.data.name || "",
          address: res.data.address || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          gstin: res.data.gstin || "",
          isCompositionScheme: !!res.data.isCompositionScheme,
          bankDetails: res.data.bankDetails || "",
          termsAndConditions: res.data.termsAndConditions || "",
          brandColor: res.data.brandColor || "#2980b9",
          logoPath: res.data.logoPath || "",
          signaturePath: res.data.signaturePath || "",
          drugLicenseNumber: res.data.drugLicenseNumber || "",
          industryType: res.data.industryType || "",
        };
        setShopData(data);
        initialDataRef.current = data;
        setPreviews({ logo: null, signature: null });
        setSecureUrls({ logo: "", signature: "" });
        setIsDirty(false);
        setErrors({});
      }
    } catch (err) {
      showSnackbar("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "name" && !value?.trim()) error = "Shop Name is required";
    if (name === "email") {
      if (!value?.trim()) error = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(value)) error = "Invalid email format";
    }
    if (name === "phone" && value?.trim()) {
      if (!/^[6-9]\d{9}$/.test(value.trim())) error = "Invalid Phone (10 digits required)";
    }
    return error;
  };

  const validateCurrentTab = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (activeTab === 0) {
      const nameErr = validateField("name", shopData.name);
      const emailErr = validateField("email", shopData.email);
      const phoneErr = validateField("phone", shopData.phone);
      newErrors.name = nameErr;
      newErrors.email = emailErr;
      newErrors.phone = phoneErr;
      if (nameErr || emailErr || phoneErr) isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setShopData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSwitchChange = (e) => {
    setShopData((prev) => ({ ...prev, isCompositionScheme: e.target.checked }));
    setIsDirty(true);
  };

  const handleFileChange = async (e, type) => {
    let file = e.target.files[0];
    if (!file) return;

    // Auto-compress if size > 50KB
    if (file.size > 50 * 1024) {
      try {
        showSnackbar("Optimizing image size...", "info");
        file = await compressImage(file);
        
        // Check again after compression
        if (file.size > 50 * 1024) {
          showSnackbar("Image is too large. Even after compression it exceeds 50KB.", "error");
          return;
        }
      } catch (err) {
        showSnackbar("Compression failed. Please upload a smaller image.", "error");
        return;
      }
    }

    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    setShopData((prev) => ({ ...prev, [`${type}File`]: file }));
    setIsDirty(true);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async () => {
    const nameErr = validateField("name", shopData.name);
    const emailErr = validateField("email", shopData.email);
    
    if (nameErr || emailErr) {
      setErrors({ ...errors, name: nameErr, email: emailErr });
      setActiveTab(0); 
      showSnackbar("Please fix required fields in General Info", "error");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      const { logoFile, signatureFile, ...rest } = shopData;
      
      const jsonPayload = Object.keys(rest).reduce((acc, key) => {
        acc[key] = rest[key] === null ? "" : rest[key];
        return acc;
      }, {});

      formData.append("shop", new Blob([JSON.stringify(jsonPayload)], { type: "application/json" }));
      if (shopData.logoFile) formData.append("logo", shopData.logoFile);
      if (shopData.signatureFile) formData.append("signature", shopData.signatureFile);

      await API.put("/api/shop", formData, { headers: { "Content-Type": "multipart/form-data" } });

      showSnackbar("Settings saved successfully!");
      setLastSaved(new Date().toLocaleTimeString());
      await loadShopDetails();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialDataRef.current) {
      setShopData(initialDataRef.current);
      setPreviews({ logo: null, signature: null });
      setSecureUrls({ logo: "", signature: "" });
      setErrors({});
      setIsDirty(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh", maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">{t("settings.title", "Business Settings")}</Typography>
          <Typography variant="body2" color="text.secondary">Configure your brand identity and defaults.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/dashboard")}>Back</Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <Tabs 
              orientation="vertical" 
              value={activeTab} 
              onChange={(e, v) => {
                validateCurrentTab();
                setActiveTab(v);
              }}
              sx={{ "& .Mui-selected": { backgroundColor: "#f1f5f9", borderLeft: "4px solid #1e293b" } }}
            >
              <Tab icon={<Storefront />} iconPosition="start" label="General Info" />
              <Tab icon={<ColorLens />} iconPosition="start" label="Branding" />
              <Tab icon={<AccountBalance />} iconPosition="start" label="Tax & Bank" />
              <Tab icon={<ReceiptLong />} iconPosition="start" label="Terms" />
            </Tabs>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #e2e8f0", minHeight: 450 }}>
            
            {activeTab === 0 && (
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>Basic Identity</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Shop Name" name="name" required value={shopData.name} onChange={handleTextChange}
                      error={!!errors.name} helperText={errors.name} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="GSTIN" name="gstin" value={shopData.gstin} onChange={handleTextChange} />
                  </Grid>
                  {shopData.industryType === 'PHARMACY' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Drug License Number"
                        name="drugLicenseNumber"
                        value={shopData.drugLicenseNumber}
                        onChange={handleTextChange}
                        placeholder="e.g. DL-MH-12345"
                        helperText="Required for pharmacy invoices (printed on every bill)"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" name="address" multiline rows={2} value={shopData.address} onChange={handleTextChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email Address" name="email" required value={shopData.email} onChange={handleTextChange}
                      error={!!errors.email} helperText={errors.email} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Phone Number" name="phone" value={shopData.phone} onChange={handleTextChange}
                      error={!!errors.phone} helperText={errors.phone} placeholder="10 digit mobile" />
                  </Grid>
                </Grid>
              </Stack>
            )}

            {activeTab === 1 && (
              <Stack spacing={4}>
                <Typography variant="h6" fontWeight={700}>Visual Branding</Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Primary Theme Color</Typography>
                  <input type="color" name="brandColor" value={shopData.brandColor} onChange={handleTextChange} 
                         style={{ width: 80, height: 45, border: '2px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Business Logo</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    <Box sx={{ width: 220, height: 120, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', overflow: 'hidden', p: 1 }}>
                        {getDisplayUrl('logo') ? (
                            <img src={getDisplayUrl('logo')} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <Typography variant="caption" color="text.disabled">No Logo Uploaded</Typography>
                        )}
                    </Box>
                    <Button variant="contained" component="label" startIcon={<CloudUpload />} sx={{ bgcolor: '#1e293b', "&:hover": { bgcolor: '#334155'} }}>
                      Upload Logo
                      <input hidden accept="image/*" type="file" onChange={(e) => handleFileChange(e, "logo")} />
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            )}

            {activeTab === 2 && (
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>Tax & Banking</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <FormControlLabel control={<Switch checked={shopData.isCompositionScheme} onChange={handleSwitchChange} color="primary" />}
                        label={<Typography variant="body2" fontWeight={700}>Are you a Composition Taxpayer?</Typography>} />
                    <Typography variant="caption" color="text.secondary" display="block">If enabled, GST will not be charged to customers and 'Bill of Supply' will be generated.</Typography>
                </Paper>
                <TextField fullWidth label="Bank Details (for Invoice)" name="bankDetails" multiline rows={4} value={shopData.bankDetails} onChange={handleTextChange} 
                           placeholder="Bank: HDFC Bank&#10;A/C: 50100123456&#10;IFSC: HDFC0001234" />
              </Stack>
            )}

            {activeTab === 3 && (
              <Stack spacing={4}>
                <Typography variant="h6" fontWeight={700}>Legal & Footer</Typography>
                <TextField fullWidth label="Terms and Conditions" name="termsAndConditions" multiline rows={6} value={shopData.termsAndConditions} onChange={handleTextChange} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Authorized Signatory</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    <Box sx={{ width: 240, height: 90, border: '1px dashed #cbd5e1', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', p: 1 }}>
                        {getDisplayUrl('signature') ? (
                            <img src={getDisplayUrl('signature')} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <Typography variant="caption" color="text.disabled">No Signature Found</Typography>
                        )}
                    </Box>
                    <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                      Upload Sign
                      <input hidden accept="image/*" type="file" onChange={(e) => handleFileChange(e, "signature")} />
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            )}

            <Box sx={{ mt: 5, pt: 3, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button variant="text" color="inherit" onClick={handleCancel} disabled={!isDirty}>Discard</Button>
              <Stack direction="row" spacing={2} alignItems="center">
                {lastSaved && <Chip icon={<CheckIcon />} size="small" color="success" label={`Saved ${lastSaved}`} variant="outlined" />}
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving || !isDirty} onClick={handleSave} sx={{ bgcolor: "#1e293b", px: 4, "&:hover": { bgcolor: "#0f172a" } }}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;