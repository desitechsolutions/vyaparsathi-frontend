import { useState, useEffect } from 'react';

/**
 * Returns an AbortController that is automatically aborted when the
 * consuming component unmounts.  Pass `controller.signal` to any
 * axios or fetch call that supports it; if the component unmounts
 * before the request completes the request will be cancelled and any
 * resulting errors silently ignored by the api.js response interceptor.
 *
 * Usage:
 *   const controller = useAbortableAPI();
 *   useEffect(() => {
 *     if (!controller) return;
 *     fetchSomeData(controller.signal).then(setData);
 *   }, [controller]);
 */
export const useAbortableAPI = () => {
  const [controller, setController] = useState(null);

  useEffect(() => {
    const newController = new AbortController();
    setController(newController);

    return () => {
      newController.abort(); // Cancel any in-flight request on unmount
    };
  }, []);

  return controller;
};
