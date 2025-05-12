/**
 * ProcureIQ Vendor Matching JavaScript
 * Handles the vendor matching functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the vendor matching page
  initializeVendorMatchingPage();
});

function initializeVendorMatchingPage() {
  // Match vendors for an RFQ
  const matchVendorsBtn = document.getElementById('match-vendors');
  if (matchVendorsBtn) {
    matchVendorsBtn.addEventListener('click', function() {
      const rfqId = this.getAttribute('data-rfq-id');
      if (rfqId) {
        matchVendorsForRfq(rfqId);
      }
    });
  }
  
  // Vendor search form
  const vendorSearchForm = document.getElementById('vendor-search-form');
  if (vendorSearchForm) {
    vendorSearchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      searchVendors();
    });
  }
  
  // Initialize radius input slider if it exists
  const radiusSlider = document.getElementById('radius-miles');
  const radiusValue = document.getElementById('radius-value');
  if (radiusSlider && radiusValue) {
    radiusSlider.addEventListener('input', function() {
      radiusValue.textContent = this.value;
    });
  }
  
  // Initialize any email generation buttons
  initializeEmailButtons();
}

/**
 * Match vendors for items in an RFQ
 * @param {string} rfqId - The ID of the RFQ
 */
function matchVendorsForRfq(rfqId) {
  // Show loading state
  showLoadingSpinner('vendor-results-container', 'Finding suitable vendors...');
  
  // Disable the match button
  const matchBtn = document.getElementById('match-vendors');
  if (matchBtn) {
    matchBtn.disabled = true;
    matchBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  // Call API to match vendors
  fetch(`/vendors/match/${rfqId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to match vendors');
    }
    return response.json();
  })
  .then(data => {
    hideLoadingSpinner('vendor-results-container');
    
    // Display the vendor matches
    displayVendorMatches(data.item_vendor_matches, rfqId);
    
    // Show success toast
    showToast('Vendors matched successfully!', 'success');
    
    // Re-enable the match button
    if (matchBtn) {
      matchBtn.disabled = false;
      matchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  })
  .catch(error => {
    hideLoadingSpinner('vendor-results-container');
    showToast(`Error: ${error.message}`, 'error');
    
    // Re-enable the match button
    if (matchBtn) {
      matchBtn.disabled = false;
      matchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

/**
 * Display vendor matches for items
 * @param {Object} itemVendorMatches - Object mapping item IDs to vendor matches
 * @param {string} rfqId - The RFQ ID
 */
function displayVendorMatches(itemVendorMatches, rfqId) {
  const container = document.getElementById('vendor-results-container');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // Check if we have matches
  if (Object.keys(itemVendorMatches).length === 0) {
    container.innerHTML = `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              No vendor matches found. Try adjusting search criteria or add items to the RFQ.
            </p>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Create an accordion for each item
  let itemIndex = 1;
  for (const itemId in itemVendorMatches) {
    const vendorMatches = itemVendorMatches[itemId];
    
    // Skip if no matches
    if (vendorMatches.length === 0) continue;
    
    const accordion = document.createElement('div');
    accordion.className = 'mb-4 border border-gray-200 rounded-lg overflow-hidden';
    
    // Get item info from the first vendor match
    let itemName = `Item #${itemIndex}`;
    if (vendorMatches.length > 0 && vendorMatches[0].vendor) {
      // This is a placeholder - in a real implementation we'd get the actual item name
      // from the item data passed with the matches
      itemName = `Item #${itemIndex}`;
    }
    
    // Create accordion header
    const header = document.createElement('div');
    header.className = 'bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer';
    header.innerHTML = `
      <h3 class="text-sm font-medium text-gray-700">${itemName}</h3>
      <span class="text-sm text-gray-500">${vendorMatches.length} vendors</span>
      <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;
    
    // Create accordion content
    const content = document.createElement('div');
    content.className = 'bg-white px-4 py-3';
    
    // Create vendor table
    const vendorTable = document.createElement('table');
    vendorTable.className = 'min-w-full divide-y divide-gray-200';
    vendorTable.innerHTML = `
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
          <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
      </tbody>
    `;
    
    // Add vendor rows
    const tableBody = vendorTable.querySelector('tbody');
    vendorMatches.forEach((match, i) => {
      const vendor = match.vendor;
      const row = document.createElement('tr');
      row.className = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      
      row.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center">
            <div>
              <div class="text-sm font-medium text-gray-900">${vendor.name}</div>
              <div class="text-sm text-gray-500">${vendor.website || 'N/A'}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm text-gray-900">${vendor.location.country}</div>
          <div class="text-sm text-gray-500">${vendor.location.city || ''} ${vendor.location.zip_code ? `(${vendor.location.zip_code})` : ''}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            ${vendor.vendor_type.replace('_', ' ')}
          </span>
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          <div class="flex items-center">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-primary-600 h-2.5 rounded-full" style="width: ${match.match_score}%"></div>
            </div>
            <span class="ml-2">${Math.round(match.match_score)}%</span>
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
          <button type="button" class="text-primary-600 hover:text-primary-900 generate-email-btn" 
                  data-rfq-id="${rfqId}" data-vendor-id="${vendor.id}" data-serial="${i+1}">
            <span class="sr-only">Generate Email</span>
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    content.appendChild(vendorTable);
    
    // Add header and content to accordion
    accordion.appendChild(header);
    accordion.appendChild(content);
    
    // Add accordion to container
    container.appendChild(accordion);
    
    // Add toggle functionality
    header.addEventListener('click', function() {
      this.classList.toggle('active');
      const icon = this.querySelector('svg');
      icon.classList.toggle('transform');
      icon.classList.toggle('rotate-180');
      
      const content = this.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
    
    itemIndex++;
  }
  
  // Initialize email buttons
  initializeEmailButtons();
}

/**
 * Initialize email generation buttons
 */
function initializeEmailButtons() {
  document.querySelectorAll('.generate-email-btn').forEach(button => {
    button.addEventListener('click', function() {
      const rfqId = this.getAttribute('data-rfq-id');
      const vendorId = this.getAttribute('data-vendor-id');
      const serial = this.getAttribute('data-serial');
      
      if (rfqId && vendorId) {
        generateEmail(rfqId, vendorId, serial);
      }
    });
  });
}

/**
 * Generate an email for a vendor
 * @param {string} rfqId - The RFQ ID
 * @param {string} vendorId - The vendor ID
 * @param {string} serial - Serial number for the email
 */
function generateEmail(rfqId, vendorId, serial) {
  // Show loading toast
  showToast('Generating email...', 'info');
  
  // Call API to generate email
  fetch(`/emails/generate/${rfqId}/${vendorId}?serial=${serial}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate email');
    }
    return response.json();
  })
  .then(data => {
    // Show success toast
    showToast('Email generated successfully!', 'success');
    
    // Show email preview modal
    showEmailPreviewModal(data.email);
  })
  .catch(error => {
    showToast(`Error: ${error.message}`, 'error');
  });
}

/**
 * Show email preview modal
 * @param {Object} email - The email object
 */
function showEmailPreviewModal(email) {
  // Check if modal already exists
  let modal = document.getElementById('email-preview-modal');
  
  if (!modal) {
    // Create modal
    modal = document.createElement('div');
    modal.id = 'email-preview-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black opacity-50"></div>
      <div class="bg-white rounded-lg overflow-hidden shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl z-10">
        <div class="bg-primary-600 text-white px-4 py-3 flex justify-between items-center">
          <h3 class="text-lg font-medium">Email Preview</h3>
          <button type="button" class="text-white hover:text-gray-200" id="close-email-modal">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="px-4 py-3">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <div class="border border-gray-300 rounded-md p-2 bg-gray-50" id="email-subject"></div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Body:</label>
            <div class="border border-gray-300 rounded-md p-3 bg-gray-50 h-60 overflow-y-auto whitespace-pre-line" id="email-body"></div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 flex justify-end">
          <button type="button" class="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" id="discard-email">
            Discard
          </button>
          <button type="button" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" id="send-email" data-email-id="">
            Send Email
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    modal.querySelector('#close-email-modal').addEventListener('click', function() {
      modal.remove();
    });
    
    modal.querySelector('#discard-email').addEventListener('click', function() {
      modal.remove();
    });
    
    // Add send functionality
    modal.querySelector('#send-email').addEventListener('click', function() {
      const emailId = this.getAttribute('data-email-id');
      if (emailId) {
        sendEmail(emailId);
        modal.remove();
      }
    });
    
    // Close when clicking backdrop
    modal.querySelector('.fixed.inset-0.bg-black').addEventListener('click', function() {
      modal.remove();
    });
  }
  
  // Update modal content
  modal.querySelector('#email-subject').textContent = email.subject;
  modal.querySelector('#email-body').textContent = email.body;
  modal.querySelector('#send-email').setAttribute('data-email-id', email.id);
}

/**
 * Send an email
 * @param {string} emailId - The email ID
 */
function sendEmail(emailId) {
  // Show loading toast
  showToast('Sending email...', 'info');
  
  // Call API to send email
  fetch(`/emails/send/${emailId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    return response.json();
  })
  .then(data => {
    // Show success toast
    showToast('Email sent successfully!', 'success');
  })
  .catch(error => {
    showToast(`Error: ${error.message}`, 'error');
  });
}

/**
 * Search vendors by criteria
 */
function searchVendors() {
  // Get search form values
  const keywords = document.getElementById('search-keywords')?.value;
  const country = document.getElementById('search-country')?.value;
  const city = document.getElementById('search-city')?.value;
  const zipCode = document.getElementById('search-zip')?.value;
  const vendorType = document.getElementById('search-vendor-type')?.value;
  const radiusMiles = document.getElementById('radius-miles')?.value;
  
  // Build query params
  const params = new URLSearchParams();
  if (keywords) params.append('keywords', keywords);
  if (country) params.append('country', country);
  if (city) params.append('city', city);
  if (zipCode) params.append('zip_code', zipCode);
  if (vendorType) params.append('vendor_type', vendorType);
  if (radiusMiles && zipCode) params.append('radius_miles', radiusMiles);
  
  // Show loading
  showLoadingSpinner('search-results-container', 'Searching vendors...');
  
  // Call API
  fetch(`/vendors/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to search vendors');
    }
    return response.json();
  })
  .then(data => {
    hideLoadingSpinner('search-results-container');
    
    // Display search results
    displaySearchResults(data.vendors);
  })
  .catch(error => {
    hideLoadingSpinner('search-results-container');
    showToast(`Error: ${error.message}`, 'error');
  });
}

/**
 * Display vendor search results
 * @param {Array} vendors - Array of vendor objects
 */
function displaySearchResults(vendors) {
  const container = document.getElementById('search-results-container');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // Check if we have results
  if (vendors.length === 0) {
    container.innerHTML = `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              No vendors found matching your criteria. Try broadening your search.
            </p>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Create results table
  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-gray-200';
  table.innerHTML = `
    <thead class="bg-gray-50">
      <tr>
        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specializations</th>
        <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200"></tbody>
  `;
  
  // Add vendor rows
  const tableBody = table.querySelector('tbody');
  vendors.forEach((vendor, i) => {
    const row = document.createElement('tr');
    row.className = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    
    row.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">${vendor.name}</div>
            <div class="text-sm text-gray-500">${vendor.website || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="text-sm text-gray-900">${vendor.location.country}</div>
        <div class="text-sm text-gray-500">${vendor.location.city || ''} ${vendor.location.zip_code ? `(${vendor.location.zip_code})` : ''}</div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          ${vendor.vendor_type.replace('_', ' ')}
        </span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        <div class="flex flex-wrap gap-1">
          ${vendor.specializations.map(spec => `
            <span class="px-2 py-0.5 text-xs rounded bg-gray-100">${spec}</span>
          `).join('')}
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
        ${vendor.email ? `
          <a href="mailto:${vendor.email}" class="text-primary-600 hover:text-primary-900">
            <svg class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        ` : 'N/A'}
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  container.appendChild(table);
}
