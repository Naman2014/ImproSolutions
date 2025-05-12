/**
 * ProcureIQ Main JavaScript
 * Handles common functionality across the app
 */

// Initialize tooltips and popovers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize any interactive elements
  initializeUI();
  
  // Setup navigation highlighting
  highlightCurrentNav();
});

/**
 * Initialize UI components
 */
function initializeUI() {
  // Initialize dropdowns
  const dropdowns = document.querySelectorAll('.dropdown-toggle');
  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdownMenu = this.nextElementSibling;
      if (dropdownMenu.classList.contains('hidden')) {
        // Close all other dropdowns first
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.classList.add('hidden');
        });
        // Open this dropdown
        dropdownMenu.classList.remove('hidden');
      } else {
        dropdownMenu.classList.add('hidden');
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    }
  });
  
  // Initialize tabs
  const tabButtons = document.querySelectorAll('[role="tab"]');
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the tab group
      const tabGroup = this.getAttribute('data-tab-group');
      
      // Deactivate all tabs in this group
      document.querySelectorAll(`[data-tab-group="${tabGroup}"]`).forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        tab.classList.remove('bg-primary-600', 'text-white');
        tab.classList.add('text-gray-500', 'hover:text-gray-700');
      });
      
      // Activate this tab
      this.setAttribute('aria-selected', 'true');
      this.classList.remove('text-gray-500', 'hover:text-gray-700');
      this.classList.add('bg-primary-600', 'text-white');
      
      // Hide all tab panels
      const tabPanels = document.querySelectorAll(`[data-tab-panel-group="${tabGroup}"]`);
      tabPanels.forEach(panel => {
        panel.classList.add('hidden');
      });
      
      // Show the panel for this tab
      const panelId = this.getAttribute('aria-controls');
      document.getElementById(panelId).classList.remove('hidden');
    });
  });
  
  // Initialize modals
  const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal-trigger');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  });
  
  const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = this.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });
  
  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
  
  // Initialize alerts
  const alertCloseButtons = document.querySelectorAll('.alert .close');
  alertCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.closest('.alert').remove();
    });
  });
}

/**
 * Highlight the current navigation item based on URL
 */
function highlightCurrentNav() {
  const currentPath = window.location.pathname;
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    
    if (href === currentPath || 
        (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('bg-primary-50', 'text-primary-700');
      link.classList.remove('text-gray-600', 'hover:bg-gray-50');
    }
  });
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in ms to show the toast
 */
function showToast(message, type = 'info', duration = 4000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  // Create the toast
  const toast = document.createElement('div');
  
  // Set appropriate classes based on type
  let typeClass = 'bg-blue-100 text-blue-700 border-blue-200'; // info default
  let icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>`;
  
  if (type === 'success') {
    typeClass = 'bg-green-100 text-green-700 border-green-200';
    icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
  } else if (type === 'error') {
    typeClass = 'bg-red-100 text-red-700 border-red-200';
    icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
  } else if (type === 'warning') {
    typeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
  }
  
  toast.className = `flex items-center p-3 mb-2 rounded-lg shadow-lg border ${typeClass} transform transition-all duration-300 opacity-0 translate-x-full`;
  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
    <button type="button" class="ml-auto text-gray-500 hover:text-gray-700" onclick="this.parentElement.remove()">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-x-full');
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Create a loading spinner
 * @param {string} containerId - The ID of the container to show the spinner in
 * @param {string} message - Optional loading message
 */
function showLoadingSpinner(containerId, message = 'Loading...') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const spinner = document.createElement('div');
  spinner.className = 'flex flex-col items-center justify-center p-6';
  spinner.innerHTML = `
    <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary-600 border-t-transparent" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-2 text-gray-600">${message}</p>
  `;
  
  // Clear container and append spinner
  container.innerHTML = '';
  container.appendChild(spinner);
}

/**
 * Hide loading spinner
 * @param {string} containerId - The ID of the container with the spinner
 */
function hideLoadingSpinner(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Find and remove spinner
  const spinner = container.querySelector('.spinner-border')?.parentElement;
  if (spinner) {
    spinner.remove();
  }
}

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
