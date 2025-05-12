/**
 * ProcureIQ Data Extraction JavaScript
 * Handles the data extraction functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the data extraction page
  initializeDataExtractionPage();
});

function initializeDataExtractionPage() {
  // Process documents button
  const processBtn = document.getElementById('process-documents');
  if (processBtn) {
    processBtn.addEventListener('click', function() {
      const rfqId = this.getAttribute('data-rfq-id');
      if (rfqId) {
        processDocuments(rfqId);
      }
    });
  }
  
  // Save item corrections button
  const saveCorrectionsBtn = document.getElementById('save-corrections');
  if (saveCorrectionsBtn) {
    saveCorrectionsBtn.addEventListener('click', function() {
      const rfqId = this.getAttribute('data-rfq-id');
      if (rfqId) {
        saveItemCorrections(rfqId);
      }
    });
  }
  
  // Add item button
  const addItemBtn = document.getElementById('add-item');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', function() {
      addNewItemRow();
    });
  }
  
  // Initialize any existing item rows
  setupItemRowHandlers();
}

/**
 * Process the documents of an RFQ
 * @param {string} rfqId - The ID of the RFQ to process
 */
function processDocuments(rfqId) {
  // Show loading state
  showLoadingSpinner('extracted-items-container', 'Processing documents with AI...');
  
  // Disable the process button
  const processBtn = document.getElementById('process-documents');
  if (processBtn) {
    processBtn.disabled = true;
    processBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  // Call API to process documents
  fetch(`/rfq/${rfqId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to process documents');
    }
    return response.json();
  })
  .then(data => {
    hideLoadingSpinner('extracted-items-container');
    
    // Display the extracted items
    displayExtractedItems(data.items);
    
    // Show the success toast
    showToast('Documents processed successfully!', 'success');
    
    // Show the items table and correction section
    const itemsTable = document.getElementById('items-table-container');
    if (itemsTable) {
      itemsTable.classList.remove('hidden');
    }
    
    const correctionsSection = document.getElementById('corrections-section');
    if (correctionsSection) {
      correctionsSection.classList.remove('hidden');
    }
  })
  .catch(error => {
    hideLoadingSpinner('extracted-items-container');
    showToast(`Error: ${error.message}`, 'error');
    
    // Re-enable the process button
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

/**
 * Display extracted items in the table
 * @param {Array} items - Array of extracted items
 */
function displayExtractedItems(items) {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Add each item as a row
  items.forEach((item, index) => {
    const row = document.createElement('tr');
    row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    row.setAttribute('data-item-id', item.id);
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900">${index + 1}</td>
      <td class="px-4 py-3 text-sm">
        <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-name" value="${item.name || ''}" required>
      </td>
      <td class="px-4 py-3 text-sm">
        <input type="number" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-quantity" value="${item.quantity || ''}">
      </td>
      <td class="px-4 py-3 text-sm">
        <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-brand" value="${item.brand || ''}">
      </td>
      <td class="px-4 py-3 text-sm">
        <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-model" value="${item.model || ''}">
      </td>
      <td class="px-4 py-3 text-sm">
        <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-size" value="${item.size || ''}">
      </td>
      <td class="px-4 py-3 text-sm">
        <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-type" value="${item.type || ''}">
      </td>
      <td class="px-4 py-3 text-sm text-right space-x-2">
        <button type="button" class="search-item-btn text-blue-600 hover:text-blue-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
        <button type="button" class="delete-item-btn text-red-600 hover:text-red-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Setup handlers for the new rows
  setupItemRowHandlers();
}

/**
 * Setup handlers for item table rows
 */
function setupItemRowHandlers() {
  // Delete item buttons
  document.querySelectorAll('.delete-item-btn').forEach(button => {
    button.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete this item?')) {
        this.closest('tr').remove();
        renumberItems();
      }
    });
  });
  
  // Search item buttons
  document.querySelectorAll('.search-item-btn').forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      const itemName = row.querySelector('[name="item-name"]').value;
      const itemBrand = row.querySelector('[name="item-brand"]').value;
      const itemModel = row.querySelector('[name="item-model"]').value;
      
      let searchQuery = itemName;
      if (itemBrand) searchQuery += ` ${itemBrand}`;
      if (itemModel) searchQuery += ` ${itemModel}`;
      
      if (searchQuery.trim()) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      } else {
        showToast('Please enter item details to search', 'warning');
      }
    });
  });
}

/**
 * Renumber the items in the table
 */
function renumberItems() {
  const rows = document.querySelectorAll('#items-table-body tr');
  rows.forEach((row, index) => {
    row.querySelector('td:first-child').textContent = index + 1;
    // Also update row background
    row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  });
}

/**
 * Add a new empty item row to the table
 */
function addNewItemRow() {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;
  
  const rowCount = tableBody.querySelectorAll('tr').length;
  const newRow = document.createElement('tr');
  newRow.className = rowCount % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  newRow.setAttribute('data-item-id', 'new-' + Date.now());
  
  newRow.innerHTML = `
    <td class="px-4 py-3 text-sm text-gray-900">${rowCount + 1}</td>
    <td class="px-4 py-3 text-sm">
      <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-name" required>
    </td>
    <td class="px-4 py-3 text-sm">
      <input type="number" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-quantity">
    </td>
    <td class="px-4 py-3 text-sm">
      <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-brand">
    </td>
    <td class="px-4 py-3 text-sm">
      <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-model">
    </td>
    <td class="px-4 py-3 text-sm">
      <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-size">
    </td>
    <td class="px-4 py-3 text-sm">
      <input type="text" class="form-input w-full rounded-md border-gray-300 shadow-sm" name="item-type">
    </td>
    <td class="px-4 py-3 text-sm text-right space-x-2">
      <button type="button" class="search-item-btn text-blue-600 hover:text-blue-800">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </button>
      <button type="button" class="delete-item-btn text-red-600 hover:text-red-800">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </td>
  `;
  
  tableBody.appendChild(newRow);
  
  // Setup handlers
  setupItemRowHandlers();
  
  // Focus on the name field of the new row
  const nameInput = newRow.querySelector('[name="item-name"]');
  if (nameInput) {
    nameInput.focus();
  }
}

/**
 * Save the corrected items
 * @param {string} rfqId - The ID of the RFQ
 */
function saveItemCorrections(rfqId) {
  // Collect the item data from the table
  const items = [];
  const rows = document.querySelectorAll('#items-table-body tr');
  
  rows.forEach(row => {
    const itemId = row.getAttribute('data-item-id');
    const name = row.querySelector('[name="item-name"]').value;
    
    // Skip if no name
    if (!name.trim()) return;
    
    const quantity = row.querySelector('[name="item-quantity"]').value;
    const brand = row.querySelector('[name="item-brand"]').value;
    const model = row.querySelector('[name="item-model"]').value;
    const size = row.querySelector('[name="item-size"]').value;
    const type = row.querySelector('[name="item-type"]').value;
    
    items.push({
      id: itemId,
      name: name,
      quantity: quantity ? parseInt(quantity) : null,
      brand: brand || null,
      model: model || null,
      size: size || null,
      type: type || null
    });
  });
  
  // Show loading
  const saveBtn = document.getElementById('save-corrections');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Saving...
    `;
  }
  
  // Call API to save items
  fetch(`/rfq/${rfqId}/items`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(items)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to save item corrections');
    }
    return response.json();
  })
  .then(data => {
    // Show success toast
    showToast('Items saved successfully!', 'success');
    
    // Enable vendor matching button
    const matchVendorsBtn = document.getElementById('match-vendors');
    if (matchVendorsBtn) {
      matchVendorsBtn.disabled = false;
      matchVendorsBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // Reset save button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Corrections';
    }
  })
  .catch(error => {
    // Show error toast
    showToast(`Error: ${error.message}`, 'error');
    
    // Reset save button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Corrections';
    }
  });
}
