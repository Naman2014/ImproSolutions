/**
 * ProcureIQ Data Extraction JavaScript
 * Handles the data extraction functionality
 */

// Initialize the data extraction page
function initializeDataExtractionPage() {
    // Setup event listeners for process button
    const processButton = document.getElementById('process-documents-btn');
    if (processButton) {
        processButton.addEventListener('click', function() {
            const rfqId = this.getAttribute('data-rfq-id');
            processDocuments(rfqId);
        });
    }
    
    // Setup handlers for existing items
    setupItemRowHandlers();
    
    // Setup add new item button
    const addItemButton = document.getElementById('add-item-btn');
    if (addItemButton) {
        addItemButton.addEventListener('click', addNewItemRow);
    }
    
    // Setup save button
    const saveButton = document.getElementById('save-items-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const rfqId = this.getAttribute('data-rfq-id');
            saveItemCorrections(rfqId);
        });
    }
}

// Process the documents of an RFQ
function processDocuments(rfqId) {
    showLoadingSpinner('items-container', 'Processing documents with AI...');
    
    fetch(`/rfq/${rfqId}/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error processing documents');
        }
        return response.json();
    })
    .then(data => {
        hideLoadingSpinner('items-container');
        displayExtractedItems(data.items);
        showToast('Documents processed successfully', 'success');
    })
    .catch(error => {
        hideLoadingSpinner('items-container');
        showToast(`Error: ${error.message}`, 'danger');
    });
}

// Display extracted items in the table
function displayExtractedItems(items) {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;
    
    let html = `
    <table id="items-table" class="table table-striped">
        <thead>
            <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Brand/Model</th>
                <th>Description</th>
                <th>Confidence</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (items && items.length > 0) {
        items.forEach((item, index) => {
            html += `
            <tr data-item-id="${item.id}">
                <td class="item-number">${index + 1}</td>
                <td>
                    <input type="text" class="form-control item-name" value="${item.name || ''}" required>
                </td>
                <td>
                    <input type="number" class="form-control item-quantity" value="${item.quantity || 1}" min="1">
                </td>
                <td>
                    <input type="text" class="form-control item-brand" value="${item.brand || ''}" placeholder="Brand">
                    <input type="text" class="form-control mt-1 item-model" value="${item.model || ''}" placeholder="Model">
                </td>
                <td>
                    <textarea class="form-control item-description">${item.description || ''}</textarea>
                </td>
                <td>
                    <div class="progress">
                        <div class="progress-bar ${getConfidenceClass(item.extracted_confidence)}" 
                             role="progressbar" 
                             style="width: ${(item.extracted_confidence || 0) * 100}%" 
                             aria-valuenow="${(item.extracted_confidence || 0) * 100}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${Math.round((item.extracted_confidence || 0) * 100)}%
                        </div>
                    </div>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger delete-item-btn">
                        <span data-feather="trash-2"></span>
                    </button>
                </td>
            </tr>
            `;
        });
    } else {
        html += `
        <tr>
            <td colspan="7" class="text-center">No items extracted. You can add items manually or process documents again.</td>
        </tr>
        `;
    }
    
    html += `
        </tbody>
    </table>
    `;
    
    itemsContainer.innerHTML = html;
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Setup handlers for the new rows
    setupItemRowHandlers();
}

// Setup handlers for item table rows
function setupItemRowHandlers() {
    // Delete item button handlers
    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            row.remove();
            renumberItems();
        });
    });
}

// Renumber the items in the table
function renumberItems() {
    document.querySelectorAll('#items-table .item-number').forEach((cell, index) => {
        cell.textContent = index + 1;
    });
}

// Add a new empty item row to the table
function addNewItemRow() {
    const itemsTable = document.getElementById('items-table');
    if (!itemsTable) return;
    
    const tbody = itemsTable.querySelector('tbody');
    const rowCount = tbody.querySelectorAll('tr').length;
    
    // Remove the "no items" row if it exists
    const noItemsRow = tbody.querySelector('tr td[colspan="7"]');
    if (noItemsRow) {
        noItemsRow.closest('tr').remove();
    }
    
    // Create a new row with a random ID
    const newId = 'new-' + Date.now();
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-item-id', newId);
    
    newRow.innerHTML = `
        <td class="item-number">${rowCount + 1}</td>
        <td>
            <input type="text" class="form-control item-name" value="" required>
        </td>
        <td>
            <input type="number" class="form-control item-quantity" value="1" min="1">
        </td>
        <td>
            <input type="text" class="form-control item-brand" value="" placeholder="Brand">
            <input type="text" class="form-control mt-1 item-model" value="" placeholder="Model">
        </td>
        <td>
            <textarea class="form-control item-description"></textarea>
        </td>
        <td>
            <div class="progress">
                <div class="progress-bar bg-secondary" 
                     role="progressbar" 
                     style="width: 0%" 
                     aria-valuenow="0" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    0%
                </div>
            </div>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-danger delete-item-btn">
                <span data-feather="trash-2"></span>
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Setup handlers for the new row
    setupItemRowHandlers();
}

// Save the corrected items
function saveItemCorrections(rfqId) {
    const itemRows = document.querySelectorAll('#items-table tbody tr');
    const items = [];
    
    itemRows.forEach(row => {
        // Skip the "no items" row if it exists
        if (row.querySelector('td[colspan="7"]')) return;
        
        const itemId = row.getAttribute('data-item-id');
        const name = row.querySelector('.item-name').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        const brand = row.querySelector('.item-brand').value;
        const model = row.querySelector('.item-model').value;
        const description = row.querySelector('.item-description').value;
        
        if (name) {
            items.push({
                id: itemId,
                name: name,
                quantity: quantity,
                brand: brand,
                model: model,
                description: description
            });
        }
    });
    
    if (items.length === 0) {
        showToast('Please add at least one item', 'warning');
        return;
    }
    
    fetch(`/rfq/${rfqId}/items`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(items)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error saving items');
        }
        return response.json();
    })
    .then(data => {
        showToast('Items saved successfully', 'success');
    })
    .catch(error => {
        showToast(`Error: ${error.message}`, 'danger');
    });
}

// Get confidence class based on value
function getConfidenceClass(confidence) {
    if (!confidence) return 'bg-secondary';
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.5) return 'bg-info';
    if (confidence >= 0.3) return 'bg-warning';
    return 'bg-danger';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDataExtractionPage();
});