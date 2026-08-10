/**
 * Lazily loads the Razorpay checkout.js SDK script.
 * Resolves true if loaded successfully, false if the script fails to load.
 * Idempotent — safe to call multiple times (reuses existing window.Razorpay).
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay] Failed to load checkout.js');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
