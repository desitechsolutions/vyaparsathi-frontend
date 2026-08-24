import { useEffect } from 'react';

export const useKeyboardShortcuts = (callbacks = {}) => {
  const {
    onCommandPalette = () => {},
    onSearch = () => {},
    onHelp = () => {},
    onEscape = () => {},
  } = callbacks;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input/textarea
      const isTypingInInput =
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.contentEditable === 'true';

      // Cmd+K or Ctrl+K - Open Command Palette
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (!isTypingInInput) {
          event.preventDefault();
          onCommandPalette();
        }
      }

      // / - Open Search
      if (event.key === '/' && !isTypingInInput) {
        event.preventDefault();
        onSearch();
      }

      // ? - Show Help
      if (event.shiftKey && event.key === '?') {
        if (!isTypingInInput) {
          event.preventDefault();
          onHelp();
        }
      }

      // Escape - Close any open menus/dialogs
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPalette, onSearch, onHelp, onEscape]);
};
