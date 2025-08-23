/* ========================================================================
   TOAST NOTIFICATION COMPONENT
   ======================================================================== */

import { createElement } from './controls.js';
import { CONFIG } from '../../config.js';

/**
 * Show a temporary toast message
 */
export function showToast(message, duration = CONFIG.ui.toast.displayDuration) {
    // Remove existing toast
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create new toast using utility
    const toast = createElement('div', {
        id: 'toast-message',
        className: 'toast-message'
    });
    toast.textContent = message;
    
    // Add to document and show
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), CONFIG.ui.toast.showDelay);
    
    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, CONFIG.ui.toast.hideDelay);
    }, duration);
}