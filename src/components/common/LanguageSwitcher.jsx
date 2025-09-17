import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Select, MenuItem, Typography } from "@mui/material";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || localStorage.getItem("language") || "en";

  const handleChange = (event) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2">{t("header.language") || "Language"}:</Typography>
      <Select
        value={currentLang}
        onChange={handleChange}
        size="small"
        sx={{ minWidth: 100 }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>{lang.label}</MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default LanguageSwitcher;
