import { useState } from 'react';

export const useHeaderState = () => {
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [quickActionAnchor, setQuickActionAnchor] = useState(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openSupportDialog, setOpenSupportDialog] = useState(false);

  const handlers = {
    openProfileMenu: (event) => setProfileMenuAnchor(event.currentTarget),
    closeProfileMenu: () => setProfileMenuAnchor(null),
    toggleProfileMenu: (event) => setProfileMenuAnchor(profileMenuAnchor ? null : event.currentTarget),

    openNotificationMenu: (event) => setNotificationAnchor(event.currentTarget),
    closeNotificationMenu: () => setNotificationAnchor(null),

    openQuickActionMenu: (event) => setQuickActionAnchor(event.currentTarget),
    closeQuickActionMenu: () => setQuickActionAnchor(null),

    openThemeMenu: (event) => setThemeMenuAnchor(event.currentTarget),
    closeThemeMenu: () => setThemeMenuAnchor(null),

    openLanguageMenu: (event) => setLanguageMenuAnchor(event.currentTarget),
    closeLanguageMenu: () => setLanguageMenuAnchor(null),

    openMobileSearch: () => setMobileSearchOpen(true),
    closeMobileSearch: () => setMobileSearchOpen(false),

    openProfileModal: () => setOpenProfileModal(true),
    closeProfileModal: () => setOpenProfileModal(false),

    openSettingsDialog: () => setOpenSettingsDialog(true),
    closeSettingsDialog: () => setOpenSettingsDialog(false),

    openSupportDialog: () => setOpenSupportDialog(true),
    closeSupportDialog: () => setOpenSupportDialog(false),

    closeAll: () => {
      setProfileMenuAnchor(null);
      setNotificationAnchor(null);
      setQuickActionAnchor(null);
      setThemeMenuAnchor(null);
      setLanguageMenuAnchor(null);
    },
  };

  return {
    state: {
      profileMenuAnchor,
      notificationAnchor,
      quickActionAnchor,
      themeMenuAnchor,
      languageMenuAnchor,
      mobileSearchOpen,
      openProfileModal,
      openSettingsDialog,
      openSupportDialog,
    },
    handlers,
  };
};
