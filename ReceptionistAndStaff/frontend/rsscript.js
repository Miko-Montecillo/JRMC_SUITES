// Initialize data structures
let roomData = {};

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Load data from API
async function loadData() {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            throw new Error('Failed to fetch rooms');
        }
        const rooms = await response.json();
        
        // Convert array to object with roomNumber as key
        roomData = rooms.reduce((acc, room) => {
            acc[room.roomNumber] = room;
            return acc;
        }, {});
        
        updateRoomStatusDisplay();
    } catch (error) {
        console.error('Error loading rooms:', error);
        alert('Failed to load room data. Please refresh the page.');
    }
}

// Function to handle guest check-in
async function checkIn() {
    const guestName = document.getElementById('checkin-name').value.trim();
    const roomNumber = document.getElementById('checkin-room').value;

    if (!guestName) {
        alert('Please enter guest name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/check-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomNumber,
                guestName
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to check in');
        }

        const updatedRoom = await response.json();
        roomData[roomNumber] = updatedRoom;
        
        document.getElementById('checkin-name').value = '';
        updateRoomStatusDisplay();
        alert(`Successfully checked in ${guestName} to room ${roomNumber}`);
    } catch (error) {
        console.error('Error during check-in:', error);
        alert(error.message || 'Failed to check in. Please try again.');
    }
}

// Function to handle guest check-out
async function checkOut() {
    const roomNumber = document.getElementById('checkout-room').value;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/check-out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomNumber
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to check out');
        }

        const checkOutData = await response.json();

        alert(
            `Checkout Summary:\n` +
            `Guest Name: ${checkOutData.guestName}\n` +
            `Room Number: ${checkOutData.roomNumber}`
        );

        roomData[roomNumber] = {
            ...roomData[roomNumber],
            occupied: false,
            guestName: null,
            checkInTime: null,
            status: 'Available'
        };
        
        updateRoomStatusDisplay();
    } catch (error) {
        console.error('Error during check-out:', error);
        alert(error.message || 'Failed to check out. Please try again.');
    }
}

// Function to update room availability
async function updateAvailability() {
    const roomNumber = document.getElementById('availability-room').value;
    const status = document.getElementById('availability-status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update room status');
        }

        const updatedRoom = await response.json();
        roomData[roomNumber] = updatedRoom;
        
        updateRoomStatusDisplay();
        alert(`Room ${roomNumber} status updated to ${status}`);
    } catch (error) {
        console.error('Error updating room status:', error);
        alert(error.message || 'Failed to update room status. Please try again.');
    }
}

// Function to update room status display
async function updateRoomStatusDisplay() {
    const roomStatusDiv = document.getElementById('room-status');
    if (!roomStatusDiv) return;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        if (!response.ok) {
            throw new Error('Failed to fetch rooms');
        }
        const rooms = await response.json();
        
        // Update roomData
        roomData = rooms.reduce((acc, room) => {
            acc[room.roomNumber] = room;
            return acc;
        }, {});

        // Clear existing display
        roomStatusDiv.innerHTML = '';

        // Sort rooms by number
        const sortedRooms = rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

        // Create room status display
        sortedRooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = `room-item ${room.status.toLowerCase()}`;
            roomElement.innerHTML = `
                <h3>Room ${room.roomNumber}</h3>
                <p>Status: ${room.status}</p>
                ${room.occupied ? `<p>Guest: ${room.guestName}</p>` : ''}
                ${room.details ? `<p>Details: ${room.details}</p>` : ''}
            `;
            roomStatusDiv.appendChild(roomElement);
        });

        console.log('Room status display updated');
    } catch (error) {
        console.error('Error updating room status:', error);
        roomStatusDiv.innerHTML = '<p class="error">Error loading room status</p>';
    }
}

// Function to generate invoice
async function generateInvoice() {
    const roomNumber = document.getElementById('invoice-room').value;
    if (!roomNumber) {
        alert('Please select a room number');
        return;
    }

    try {
        // Fetch booking data for the room
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/booking`);
        if (!response.ok) {
            if (response.status === 404) {
                alert('No booking found for this room');
                return;
            }
            throw new Error('Failed to fetch booking data');
        }
        
        const invoiceData = await response.json();
        const { booking, room, generatedAt } = invoiceData;

        // Calculate duration and amount
        const checkInTime = new Date(booking.checkIn);
        const checkOutTime = booking.checkOut ? new Date(booking.checkOut) : new Date();
        
        const roomType = roomNumber.charAt(0);
        const roomRates = {
            'A': { rate: 3000, per: 'month' },  // Student Dorm
            'B': { rate: 690, per: 'night' },   // Single Bedroom
            'C': { rate: 1350, per: 'night' },  // Double Bedroom
            'D': { rate: 2000, per: 'night' },  // Family Room
            'E': { rate: 5000, per: 'day' }     // Event Hall
        };

        const { rate, per } = roomRates[roomType] || roomRates['B'];
        let duration, totalAmount, durationText;

        if (per === 'month') {
            // For Student Dorm - calculate months
            const months = (checkOutTime.getFullYear() - checkInTime.getFullYear()) * 12 + 
                          (checkOutTime.getMonth() - checkInTime.getMonth());
            const remainingDays = checkOutTime.getDate() - checkInTime.getDate();
            duration = months + (remainingDays > 0 ? 1 : 0); // Round up for partial months
            durationText = `${duration} month${duration !== 1 ? 's' : ''}`;
        } else if (per === 'day') {
            // For Event Halls - include both check-in and check-out days
            const durationInMs = checkOutTime - checkInTime;
            duration = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)) + 1;
            durationText = `${duration} day${duration !== 1 ? 's' : ''}`;
        } else {
            // For hotel rooms (nightly rates)
            const durationInMs = checkOutTime - checkInTime;
            duration = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
            durationText = `${duration} night${duration !== 1 ? 's' : ''}`;
        }

        totalAmount = rate * duration;

        // Format dates (MM/DD/YYYY)
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            });
        };

        // Generate invoice with the specified format
        const invoice = 
            `HOTEL INVOICE\n` +
            `=============\n\n` +
            `Booking ID: ${booking.bookingId}\n` +
            `Room: ${roomNumber} (${roomType})\n` +
            `Guest: ${booking.guestName}\n\n` +
            `Check-in:  ${formatDate(checkInTime)}\n` +
            `Check-out: ${formatDate(checkOutTime)}\n\n` +
            `Duration: ${durationText}\n` +
            `Rate: ₱${rate.toLocaleString('en-PH')}/${per}\n` +
            `Total Amount: ₱${totalAmount.toLocaleString('en-PH')}`;

        // Display the invoice
        const invoiceDisplay = document.getElementById('invoice-display');
        if (invoiceDisplay) {
            invoiceDisplay.textContent = invoice;
            invoiceDisplay.style.whiteSpace = 'pre-wrap';
        } else {
            alert(invoice);
        }
    } catch (error) {
        console.error('Error generating invoice:', error);
        alert('Failed to generate invoice. Please try again.');
    }
}

// Helper function to get room-specific notes
function getRoomNote(roomType) {
    const notes = {
        'A': 'For Student Dorm, any partial month is counted as a full month.',
        'B': 'Check-out time is 12:00 PM (noon). Late check-out may incur additional charges.',
        'C': 'Check-out time is 12:00 PM (noon). Late check-out may incur additional charges.',
        'D': 'Check-out time is 12:00 PM (noon). Late check-out may incur additional charges.',
        'E': 'Both check-in and check-out days are included in the duration for Event Halls.'
    };
    return notes[roomType] || 'Check-out time is 12:00 PM (noon). Late check-out may incur additional charges.';
}

// Function to handle tab switching
function openTab(event, tabId) {
    const sections = document.getElementsByClassName('section');
    for (let section of sections) {
        section.classList.remove('active');
    }

    const tabLinks = document.getElementsByClassName('tab-link');
    for (let link of tabLinks) {
        link.classList.remove('active');
    }

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Function to modify room details
async function modifyRoom() {
    const roomNumber = document.getElementById('modify-room').value;
    const newDetails = document.getElementById('modify-details').value.trim();

    if (!newDetails) {
        alert('Please enter new details');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/details`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                details: newDetails
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update room details');
        }

        await loadData(); // Reload room data
        alert(`Successfully updated details for room ${roomNumber}`);
        document.getElementById('modify-details').value = '';
    } catch (error) {
        console.error('Error updating room details:', error);
        alert('Failed to update room details. Please try again.');
    }
}

// Function to modify room availability
async function modifyAvailability() {
    const roomNumber = document.getElementById('availability-room').value;
    const newStatus = document.getElementById('availability-status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update room availability');
        }

        const updatedRoom = await response.json();
        // Update local room data
        roomData[roomNumber] = updatedRoom;
        updateRoomStatusDisplay();
        alert(`Successfully updated availability for room ${roomNumber} to ${newStatus}`);
    } catch (error) {
        console.error('Error updating room availability:', error);
        alert(error.message || 'Failed to update room availability. Please try again.');
    }
}

// Function to clear room details
async function clearRoomDetails() {
    const roomNumber = document.getElementById('modify-room').value;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/details`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                details: ''  // Set details to empty string
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to clear room details');
        }

        const updatedRoom = await response.json();
        // Update local room data
        roomData[roomNumber] = updatedRoom;
        // Clear the input field
        document.getElementById('modify-details').value = '';
        alert(`Successfully cleared details for room ${roomNumber}`);
    } catch (error) {
        console.error('Error clearing room details:', error);
        alert(error.message || 'Failed to clear room details. Please try again.');
    }
}

// Function to toggle custom request input
function toggleCustomRequestInput() {
    const requestType = document.getElementById('request-type').value;
    const customInput = document.getElementById('custom-request-input');
    if (customInput) {
        customInput.style.display = requestType === 'custom' ? 'block' : 'none';
    }
}

// Function to submit staff request
async function submitStaffRequest() {
    const requestType = document.getElementById('request-type').value;
    const customType = document.getElementById('custom-request-type')?.value;
    const description = document.getElementById('request-description').value;
    const room = document.getElementById('request-room').value;
    const priority = document.getElementById('request-priority').value;

    if (!description || !room) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: requestType,
                customType: requestType === 'custom' ? customType : undefined,
                description,
                room,
                priority,
                status: 'pending'
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit request');
        }

        // Clear form
        document.getElementById('request-description').value = '';
        if (customType) {
            document.getElementById('custom-request-type').value = '';
        }
        
        await updateStaffRequestsDisplay();
        await updateCategorizedRequestsDisplay();
        alert('Request submitted successfully');
    } catch (error) {
        console.error('Error submitting request:', error);
        alert('Failed to submit request. Please try again.');
    }
}

// Function to update staff requests display
async function updateStaffRequestsDisplay() {
    const requestsList = document.getElementById('active-requests');
    const completedList = document.getElementById('completed-requests');
    if (!requestsList || !completedList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests`);
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        const requests = await response.json();

        // Update active requests
        requestsList.innerHTML = '';
        const activeRequests = requests.filter(request => request.status === 'pending');

        if (activeRequests.length === 0) {
            requestsList.innerHTML = '<p class="no-requests">No pending requests</p>';
        } else {
            activeRequests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.className = `request-item priority-${request.priority}`;
                requestElement.innerHTML = `
                    <div class="request-header">
                        <span class="room-number">Room ${request.room}</span>
                        <span class="priority priority-${request.priority}">${request.priority}</span>
                    </div>
                    <p class="description">${request.type === 'custom' ? request.customType : request.type}: ${request.description}</p>
                    <p class="timestamp">${new Date(request.timestamp).toLocaleString()}</p>
                    <div class="actions">
                        <button class="btn" onclick="completeRequest('${request._id}')">Complete</button>
                        <button class="btn" onclick="deleteRequest('${request._id}')">Delete</button>
                    </div>
                `;
                requestsList.appendChild(requestElement);
            });
        }

        // Update completed requests
        completedList.innerHTML = '';
        const completedRequests = requests.filter(request => request.status === 'completed');
        
        if (completedRequests.length === 0) {
            completedList.innerHTML = '<p class="no-requests">No completed requests</p>';
        } else {
            // Sort completed requests by timestamp, most recent first
            completedRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            completedRequests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.className = `request-item completed priority-${request.priority}`;
                requestElement.innerHTML = `
                    <div class="request-header">
                        <span class="room-number">Room ${request.room}</span>
                        <span class="priority priority-${request.priority}">${request.priority}</span>
                        <span class="completion-time">Completed: ${new Date(request.completedAt || request.timestamp).toLocaleString()}</span>
                    </div>
                    <p class="description">${request.type === 'custom' ? request.customType : request.type}: ${request.description}</p>
                    <p class="timestamp">Created: ${new Date(request.timestamp).toLocaleString()}</p>
                    <div class="actions">
                        <button class="btn delete-btn" onclick="deleteRequest('${request._id}')">Remove from History</button>
                    </div>
                `;
                completedList.appendChild(requestElement);
            });
        }

    } catch (error) {
        console.error('Error updating staff requests:', error);
        requestsList.innerHTML = '<p class="error">Error loading requests</p>';
        completedList.innerHTML = '<p class="error">Error loading requests</p>';
    }
}

// Function to clear completed requests history
async function clearCompletedHistory() {
    if (!confirm('Are you sure you want to clear all completed requests history? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests/completed`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to clear history');
        }

        await updateStaffRequestsDisplay();
        await updateCategorizedRequestsDisplay();
        alert('Completed requests history has been cleared');
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Failed to clear history. Please try again.');
    }
}

// Function to complete a request
async function completeRequest(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'completed',
                completedAt: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to complete request');
        }

        await updateStaffRequestsDisplay();
        await updateCategorizedRequestsDisplay();
        alert('Request marked as completed');
    } catch (error) {
        console.error('Error completing request:', error);
        alert('Failed to complete request. Please try again.');
    }
}

// Function to update categorized requests display
async function updateCategorizedRequestsDisplay() {
    const maintenanceList = document.getElementById('maintenance-requests');
    const housekeepingList = document.getElementById('housekeeping-requests');
    const technicalList = document.getElementById('technical-requests');
    const otherList = document.getElementById('other-requests');

    if (!maintenanceList && !housekeepingList && !technicalList && !otherList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests`);
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        const requests = await response.json();

        // Clear existing displays
        [maintenanceList, housekeepingList, technicalList, otherList].forEach(list => {
            if (list) list.innerHTML = '';
        });

        // Get only active (pending) requests
        const activeRequests = requests.filter(request => request.status === 'pending');
        console.log('Active requests:', activeRequests); // Debug log

        // Group active requests by type
        const requestsByType = {
            maintenance: [],
            housekeeping: [],
            technical: [],
            other: []
        };

        activeRequests.forEach(request => {
            const requestType = request.type.toLowerCase();
            console.log('Processing request type:', requestType); // Debug log

            if (requestType === 'maintenance') {
                requestsByType.maintenance.push(request);
            } else if (requestType === 'housekeeping') {
                requestsByType.housekeeping.push(request);
            } else if (requestType === 'technical') {
                requestsByType.technical.push(request);
            } else {
                requestsByType.other.push(request);
            }
        });

        console.log('Grouped requests:', requestsByType); // Debug log

        // Function to create request element
        const createRequestElement = (request) => {
            const requestElement = document.createElement('div');
            requestElement.className = `request-item priority-${request.priority}`;
            requestElement.innerHTML = `
                <div class="request-header">
                    <span class="room-number">Room ${request.room}</span>
                    <span class="priority priority-${request.priority}">${request.priority}</span>
                </div>
                <p class="description">${request.type === 'custom' ? request.customType : request.type}: ${request.description}</p>
                <p class="timestamp">${new Date(request.timestamp).toLocaleString()}</p>
                <div class="actions">
                    <button class="btn" onclick="completeRequest('${request._id}')">Complete</button>
                    <button class="btn" onclick="deleteRequest('${request._id}')">Delete</button>
                </div>
            `;
            return requestElement;
        };

        // Display requests in their respective categories
        if (maintenanceList) {
            if (requestsByType.maintenance.length === 0) {
                maintenanceList.innerHTML = '<p class="no-requests">No active maintenance requests</p>';
            } else {
                requestsByType.maintenance.forEach(request => {
                    maintenanceList.appendChild(createRequestElement(request));
                });
            }
        }

        if (housekeepingList) {
            if (requestsByType.housekeeping.length === 0) {
                housekeepingList.innerHTML = '<p class="no-requests">No active housekeeping requests</p>';
            } else {
                requestsByType.housekeeping.forEach(request => {
                    housekeepingList.appendChild(createRequestElement(request));
                });
            }
        }

        if (technicalList) {
            if (requestsByType.technical.length === 0) {
                technicalList.innerHTML = '<p class="no-requests">No active technical support requests</p>';
            } else {
                requestsByType.technical.forEach(request => {
                    technicalList.appendChild(createRequestElement(request));
                });
            }
        }

        if (otherList) {
            if (requestsByType.other.length === 0) {
                otherList.innerHTML = '<p class="no-requests">No active requests</p>';
            } else {
                requestsByType.other.forEach(request => {
                    otherList.appendChild(createRequestElement(request));
                });
            }
        }

        console.log('Categorized requests display updated');
    } catch (error) {
        console.error('Error updating categorized requests:', error);
        const errorMessage = '<p class="error">Error loading requests</p>';
        [maintenanceList, housekeepingList, technicalList, otherList].forEach(list => {
            if (list) list.innerHTML = errorMessage;
        });
    }
}

// Function to delete a request
async function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff-requests/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete request');
        }

        await updateStaffRequestsDisplay();
        await updateCategorizedRequestsDisplay();
        alert('Request deleted successfully');
    } catch (error) {
        console.error('Error deleting request:', error);
        alert('Failed to delete request. Please try again.');
    }
}

// Function to initialize widget functionality
function initializeWidgets() {
    const headers = document.querySelectorAll('.widget-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const widget = header.closest('.widget');
            widget.classList.toggle('collapsed');
            
            // Save the state to localStorage
            const categoryId = widget.querySelector('.request-category').id;
            localStorage.setItem(`category-${categoryId}-collapsed`, widget.classList.contains('collapsed'));
        });
    });
}

// Function to fetch and display all bookings
async function fetchAndDisplayBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        alert('Failed to load bookings. Please refresh the page.');
    }
}

// Function to display bookings in the admin dashboard
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;

    bookingsList.innerHTML = '';
    bookings.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.className = 'booking-item';
        const checkIn = new Date(booking.checkIn).toLocaleString();
        const checkOut = new Date(booking.checkOut).toLocaleString();
        
        bookingElement.innerHTML = `
            <div class="booking-header">
                <h3>Booking #${booking._id}</h3>
                <span class="status ${booking.status}">${booking.status}</span>
            </div>
            <div class="booking-details">
                <p><strong>Guest:</strong> ${booking.guestName}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Phone:</strong> ${booking.phone || 'N/A'}</p>
                <p><strong>Room Type:</strong> ${booking.roomType}</p>
                <p><strong>Check-in:</strong> ${checkIn}</p>
                <p><strong>Check-out:</strong> ${checkOut}</p>
                <p><strong>Guests:</strong> ${booking.numberOfGuests}</p>
                <p><strong>Total Amount:</strong> ₱${booking.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
            </div>
            <div class="booking-actions">
                ${getBookingActionButtons(booking)}
            </div>
        `;
        bookingsList.appendChild(bookingElement);
    });
}

// Function to get appropriate action buttons based on booking status
function getBookingActionButtons(booking) {
    let buttons = '';
    
    switch (booking.status) {
        case 'pending':
            buttons = `
                <button onclick="updateBookingStatus('${booking._id}', 'confirmed')">Confirm</button>
                <button onclick="updateBookingStatus('${booking._id}', 'cancelled')">Cancel</button>
            `;
            break;
        case 'confirmed':
            buttons = `
                <button onclick="updateBookingStatus('${booking._id}', 'checked-in')">Check In</button>
                <button onclick="updateBookingStatus('${booking._id}', 'cancelled')">Cancel</button>
            `;
            break;
        case 'checked-in':
            buttons = `
                <button onclick="updateBookingStatus('${booking._id}', 'checked-out')">Check Out</button>
            `;
            break;
    }
    
    return buttons;
}

// Function to update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update booking status');
        }

        // Refresh the bookings display
        fetchAndDisplayBookings();
    } catch (error) {
        console.error('Error updating booking status:', error);
        alert('Failed to update booking status. Please try again.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize widgets if they exist
        initializeWidgets();
        
        // Load initial room data
        await loadData();
        
        // Update staff requests if on staff page
        const staffList = document.getElementById('active-requests');
        if (staffList) {
            await updateStaffRequestsDisplay();
        }
        
        // Check for categorized staff requests page
        const maintenanceList = document.getElementById('maintenance-requests');
        const housekeepingList = document.getElementById('housekeeping-requests');
        const technicalList = document.getElementById('technical-requests');
        const otherList = document.getElementById('other-requests');
        
        // If any of the category lists exist, we're on the categorized page
        if (maintenanceList || housekeepingList || technicalList || otherList) {
            console.log('Initializing categorized requests display');
            await updateCategorizedRequestsDisplay();
            // Update categorized requests every 30 seconds
            setInterval(updateCategorizedRequestsDisplay, 30000);
        }
        
        // Set up room status updates
        const roomStatus = document.getElementById('room-status');
        if (roomStatus) {
            updateRoomStatusDisplay();
        }
        
        // Set up request type change handler
        const requestType = document.getElementById('request-type');
        if (requestType) {
            requestType.addEventListener('change', toggleCustomRequestInput);
        }
        
        // Fetch and display bookings if on relevant page
        const bookingsSection = document.getElementById('bookings-section');
        if (bookingsSection) {
            fetchAndDisplayBookings();
            // Refresh bookings every 30 seconds
            setInterval(fetchAndDisplayBookings, 30000);
        }
        
        console.log('Page initialized successfully');
    } catch (error) {
        console.error('Error during page initialization:', error);
    }
});

// Add event listeners for category dropdowns
document.addEventListener('DOMContentLoaded', function() {
    // Handle category dropdowns
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const categorySection = this.closest('.category-section');
            categorySection.classList.toggle('collapsed');
            
            // Save the state to localStorage
            const categoryId = categorySection.querySelector('.request-category').id;
            localStorage.setItem(`category-${categoryId}-collapsed`, categorySection.classList.contains('collapsed'));
        });
    });
    
    // Restore collapsed state from localStorage for categories
    document.querySelectorAll('.category-section').forEach(section => {
        const categoryId = section.querySelector('.request-category').id;
        const isCollapsed = localStorage.getItem(`category-${categoryId}-collapsed`) === 'true';
        if (isCollapsed) {
            section.classList.add('collapsed');
        }
    });
});

// Function to modify room availability
async function modifyAvailability() {
    const roomNumber = document.getElementById('availability-room').value;
    const newStatus = document.getElementById('availability-status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update room availability');
        }

        const updatedRoom = await response.json();
        // Update local room data
        roomData[roomNumber] = updatedRoom;
        updateRoomStatusDisplay();
        alert(`Successfully updated availability for room ${roomNumber} to ${newStatus}`);
    } catch (error) {
        console.error('Error updating room availability:', error);
        alert(error.message || 'Failed to update room availability. Please try again.');
    }
}
