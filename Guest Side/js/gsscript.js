let navbar = document.querySelector('.header .navbar');
let menuBtn = document.querySelector('#menu-btn');

if (menuBtn) {
    menuBtn.onclick = () => {
        if (navbar) {
            navbar.classList.toggle('active');
        }
    }
}

window.onscroll = () => {
    if (navbar) {
        navbar.classList.remove('active');
    }
}

document.querySelectorAll('.contact .row .faq .box h3').forEach(faqBox => {
    faqBox.onclick = () => {
        faqBox.parentElement.classList.toggle('active');
    }
});

function checkAvailability() {
    const checkIn = document.getElementById('check_in_availability').value;
    const checkOut = document.getElementById('check_out_availability').value;
    const roomSelect = document.getElementById('roomSelect');
    const roomType = roomSelect.value; // Get the selected value (e.g., "A")
    const roomTypeText = roomSelect.options[roomSelect.selectedIndex].text; // Get the displayed text (e.g., "Student Dorm")

    // Validate that all fields are filled out
    if (!checkIn || !checkOut || !roomType) {
        alert('Please fill out all fields.');
        return; // Stop execution if any field is empty
    }

    // Validate that check-out is after check-in
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
        alert('Check-out date must be after check-in date.');
        return;
    }

    // For Student Dorm (Type A), validate minimum 1-month stay
    if (roomType === 'A') {
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 30) { // Exactly one month minimum required
            alert('Student Dorm requires a minimum stay of exactly 1 month (30 days).');
            return;
        }
    }

    // Store the dates and room type in localStorage
    localStorage.setItem('check_in', checkIn);
    localStorage.setItem('check_out', checkOut);
    
    // Map room type value to full name
    const roomTypes = {
        'A': 'Student Dorm',
        'B': 'Single Bedroom',
        'C': 'Double Bedroom',
        'D': 'Family Room',
        'E': 'Event Halls'
    };
    
    // Store the full room type name
    localStorage.setItem('room_type', roomTypes[roomType]);
    console.log('Setting initial room type:', roomTypes[roomType]); // Debug log

    // Redirect to the corresponding room type page
    const roomPages = {
        A: "studentDorm.html",
        B: "singleBedroom.html",
        C: "doubleBedroom.html",
        D: "familyRoom.html",
        E: "eventHalls.html"
    };

    const selectedPage = roomPages[roomType];
    if (selectedPage) {
        window.location.href = selectedPage;
    } else {
        alert('Invalid room type selected.');
    }
}

const API_BASE_URL = 'http://localhost:3000/api';

// Function to submit booking to backend
async function submitBookingToBackend(bookingData) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit booking');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error submitting booking:', error);
        throw error;
    }
}

async function bookRoomAndRedirect(buttonElement) {
    try {
        const roomId = buttonElement.closest('.room-item').id;
        
        // Check room status first
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/status`);
        const roomStatus = await response.json();
        
        if (!roomStatus.isAvailable) {
            let message = 'This room is currently not available.';
            if (roomStatus.status === 'Occupied') {
                message = 'This room is currently occupied.';
            } else if (roomStatus.status === 'Maintenance') {
                message = 'This room is currently under maintenance.';
            }
            alert(message);
            return;
        }

        // Clear any existing booking data first
        const keysToKeep = ['check_in', 'check_out']; // Keep only check-in/out dates
        for (let i = 0; i <localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !keysToKeep.includes(key) && key.startsWith('booking_') || 
                ['room_id', 'room_type', 'total_amount', 'guest_name', 'guest_email', 'num_guests'].includes(key)) {
                localStorage.removeItem(key);
            }
        }

        const roomTypes = {
            'A': 'Student Dorm',
            'B': 'Single Bedroom',
            'C': 'Double Bedroom',
            'D': 'Family Room',
            'E': 'Event Halls'
        };
        const roomType = roomTypes[roomId[0]];
        const checkIn = localStorage.getItem('check_in');
        const checkOut = localStorage.getItem('check_out');

        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates first');
            window.location.href = 'checkAvailability.html';
            return;
        }

        const priceDetails = calculateTotalPrice(roomType, checkIn, checkOut);
        
        // Store only the necessary booking details
        localStorage.setItem('room_id', roomId);
        localStorage.setItem('room_type', roomType);
        localStorage.setItem('total_amount', priceDetails.total.toString());

        window.location.href = 'booking.html';
    } catch (error) {
        console.error('Error in booking process:', error);
        alert('Failed to process booking. Please try again.');
    }
}

function reserveRoomAndRedirect(buttonElement) {
    // Retrieve the ID of the parent div (room-item)
    const roomId = buttonElement.closest('.room-item').id;

    console.log('Reserving Room with ID:', roomId); // Debugging

    // Store the selected room ID and type in localStorage
    localStorage.setItem('room_id', roomId);
    
    // Set room type based on the first character of the room ID
    const roomTypes = {
        'A': 'Student Dorm',
        'B': 'Single Bedroom',
        'C': 'Double Bedroom',
        'D': 'Family Room',
        'E': 'Event Halls'
    };
    const roomType = roomTypes[roomId[0]];
    if (roomType) {
        localStorage.setItem('room_type', roomType);
        console.log('Setting room type:', roomType); // Debugging
    }

    // Now redirect to the booking page
    window.location.href = "reservation.html"; // Redirect to the booking page
}

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve stored data for booking page
    const checkIn = localStorage.getItem('check_in');
    const checkOut = localStorage.getItem('check_out');
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');

    // Populate booking form fields
    const checkInField = document.getElementById('check_in_booking');
    const checkOutField = document.getElementById('check_out_booking');
    if (checkInField) checkInField.value = checkIn;
    if (checkOutField) checkOutField.value = checkOut;

    // Display selected room details
    const roomDetails = document.getElementById('roomDetails');
    if (roomDetails) {
        roomDetails.innerHTML = `
            <p>Room Type: ${roomType}</p>
            <p>Room ID: ${roomId}</p>
        `;
    }
});

// Handle form submission on the booking page
document.querySelector('.booking form')?.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission

    // Collect booking details
    const checkIn = document.getElementById('check_in_booking').value;
    const checkOut = document.getElementById('check_out_booking').value;
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');

    if (!checkIn || !checkOut || !roomType || !roomId) {
        alert('Please complete the booking details.');
        return;
    }

    // Generate a unique booking ID
    const bookingId = generateUniqueBookingId();

    // Store booking details
    localStorage.setItem('check_in', checkIn);
    localStorage.setItem('check_out', checkOut);
    localStorage.setItem('booking_id', bookingId);

    // Redirect to the payment page
    window.location.href = 'payment.html';
});

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve stored booking details
    const checkIn = localStorage.getItem('check_in');
    const checkOut = localStorage.getItem('check_out');
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');
    const bookingId = localStorage.getItem('booking_id');

    // Populate payment details
    const roomTypeField = document.getElementById('roomType');
    const roomIdField = document.getElementById('roomId');
    const checkInDateField = document.getElementById('checkInDate');
    const checkOutDateField = document.getElementById('checkOutDate');
    const totalPriceField = document.getElementById('totalPrice');

    if (roomTypeField) roomTypeField.textContent = `Room Type: ${roomType}`;
    if (roomIdField) roomIdField.textContent = `Room ID: ${roomId}`;
    if (checkInDateField) checkInDateField.textContent = `Check-in Date: ${checkIn}`;
    if (checkOutDateField) checkOutDateField.textContent = `Check-out Date: ${checkOut}`;

    // Calculate total price
    if (roomType && checkIn && checkOut) {
        const { total, duration, per } = calculateTotalPrice(roomType, checkIn, checkOut);
        if (totalPriceField) {
            totalPriceField.textContent = `Total Price: Php ${formatCurrency(total)} (${duration} ${per}${duration > 1 ? 's' : ''})`;
        }
    } else if (totalPriceField) {
        totalPriceField.textContent = 'Total Price: N/A';
    }

    // Display the unique booking ID
    const bookingIdField = document.getElementById('bookingIdMessage');
    if (bookingIdField) {
        bookingIdField.textContent = `Your Booking ID: ${bookingId}`;
    }
});

// Handle payment form submission
document.getElementById('paymentForm')?.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const name = document.getElementById('name').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const cvv = document.getElementById('cvv').value;
    const email = document.getElementById('email').value;
    const contactNo = document.getElementById('contactNo').value;

    // Validate fields
    if (!name || !cardNumber || !cvv || !email || !contactNo) {
        alert('Please fill out all fields.');
        return;
    }

    if (cardNumber.length !== 16 || isNaN(cardNumber)) {
        alert('Invalid card number.');
        return;
    }

    if (cvv.length !== 3 || isNaN(cvv)) {
        alert('Invalid CVV.');
        return;
    }

    try {
        // Get current booking details
        const roomType = localStorage.getItem('room_type');
        const roomId = localStorage.getItem('room_id');
        const checkIn = localStorage.getItem('check_in');
        const checkOut = localStorage.getItem('check_out');
        const totalAmount = localStorage.getItem('total_amount');

        if (!roomType || !roomId || !checkIn || !checkOut || !totalAmount) {
            throw new Error('Missing booking details');
        }

        // Generate unique booking ID before submitting to backend
        const uniqueBookingId = generateUniqueBookingId();
        
        // Prepare booking data with current information only
        const bookingData = {
            bookingId: uniqueBookingId,
            guestName: name,
            email: email,
            phone: contactNo,
            roomType: roomType,
            roomNumber: roomId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            numberOfGuests: 1, // Default to 1 if not specified
            status: 'confirmed',
            paymentStatus: 'paid',
            totalAmount: parseFloat(totalAmount)
        };

        // Submit booking to backend
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error('Failed to create booking');
        }

        const booking = await response.json();

        // Show confirmation message
        document.getElementById('confirmationMessage').style.display = 'block';
        document.getElementById('paymentForm').style.display = 'none';

        // Display booking ID in confirmation message using the generated unique ID
        const bookingIdMessage = document.getElementById('bookingIdMessage');
        if (bookingIdMessage) {
            bookingIdMessage.textContent = `Your Booking ID: ${uniqueBookingId}`;
        }

        // Clear all booking data from localStorage
        const keysToRemove = [
            'check_in',
            'check_out',
            'room_type',
            'room_id',
            'total_amount',
            'num_guests',
            'booking_id'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));

    } catch (error) {
        console.error('Error creating booking:', error);
        alert('Failed to process booking. Please try again.');
    }
});

function generateUniqueBookingId() {
    const usedIds = JSON.parse(localStorage.getItem('used_booking_ids')) || []; // Retrieve used IDs
    let newId;

    // Generate a unique ID
    do {
        newId = `BID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    } while (usedIds.includes(newId)); // Ensure it's unique

    // Add the new ID to the list of used IDs
    usedIds.push(newId);
    localStorage.setItem('used_booking_ids', JSON.stringify(usedIds));

    return newId;
}

// Handle "Back to Home" button click
document.getElementById('backToHome')?.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to the homepage (change the URL to your actual home page)
});

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve data from localStorage
    const checkIn = localStorage.getItem('check_in');
    const checkOut = localStorage.getItem('check_out');
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');

    // Populate reservation form fields
    const checkInField = document.getElementById('check_in_reservation');
    const checkOutField = document.getElementById('check_out_reservation');
    if (checkInField) checkInField.value = checkIn;
    if (checkOutField) checkOutField.value = checkOut;

    // Display room details
    const roomDetails = document.getElementById('roomDetails');
    if (roomDetails) {
        roomDetails.innerHTML = `
            <p>Room Type: ${roomType}</p>
            <p>Room ID: ${roomId}</p>
        `;
    }

    // Redirect to Confirm Reservation page
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual submission

            const checkInField = document.getElementById('check_in_reservation');
            const checkOutField = document.getElementById('check_out_reservation');

            // Only proceed if we have all the required fields
            if (checkInField && checkOutField && roomType && roomId) {
                // Store data in localStorage and redirect
                localStorage.setItem('check_in', checkInField.value);
                localStorage.setItem('check_out', checkOutField.value);
                localStorage.setItem('room_type', roomType);
                localStorage.setItem('room_id', roomId);

                window.location.href = 'confirmReservation.html';
            } else {
                console.log('Missing required fields:', {
                    checkInField: !!checkInField,
                    checkOutField: !!checkOutField,
                    roomType: !!roomType,
                    roomId: !!roomId
                });
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve data from localStorage
    const checkIn = localStorage.getItem('check_in');
    const checkOut = localStorage.getItem('check_out');
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');

    // Display data
    const roomTypeElement = document.getElementById('roomType');
    const roomIdElement = document.getElementById('roomId');
    const checkInDateElement = document.getElementById('checkInDate');
    const checkOutDateElement = document.getElementById('checkOutDate');
    if (roomTypeElement) roomTypeElement.textContent = `Room Type: ${roomType}`;
    if (roomIdElement) roomIdElement.textContent = `Room ID: ${roomId}`;
    if (checkInDateElement) checkInDateElement.textContent = `Check-in Date: ${checkIn}`;
    if (checkOutDateElement) checkOutDateElement.textContent = `Check-out Date: ${checkOut}`;

    // Generate Reservation ID and expiry
    const reservationId = generateUniqueReservationId();
    const expiryDate = generateExpiryDate();

    // Store Reservation ID and expiry in localStorage
    localStorage.setItem('reservation_id', reservationId);
    localStorage.setItem('reservation_expiry', expiryDate);

    // Display Reservation ID and expiry
    const reservationIdElement = document.getElementById('reservationIdMessage');
    const expiryElement = document.getElementById('expiryDateMessage');
    if (reservationIdElement) {
        reservationIdElement.textContent = `Your Reservation ID: ${reservationId}`;
    }
    if (expiryElement) {
        expiryElement.textContent = `Reservation Expiry: ${expiryDate}`;
    }

    // Confirm reservation form handling
    const confirmForm = document.getElementById('confirmReservationForm');
    if (confirmForm) {
        confirmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Reservation Confirmed!');
            localStorage.clear(); // Optional: Clear reservation-related data
            window.location.href = 'success.html'; // Redirect to success page
        });
    }
});

// Helper: Generate a unique reservation ID
function generateUniqueReservationId() {
    const usedIds = JSON.parse(localStorage.getItem('used_reservation_ids')) || [];
    let newId;

    // Generate a unique ID in the same format as booking ID
    do {
        newId = `RID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    } while (usedIds.includes(newId));

    // Add the new ID to the list of used IDs
    usedIds.push(newId);
    localStorage.setItem('used_reservation_ids', JSON.stringify(usedIds));

    return newId;
}

// Helper: Generate expiry date (e.g., 24 hours from now)
function generateExpiryDate() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 1); // Add 1 day
    return expiry.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Handle reservation summary display
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the confirmation page
    const reservationSummary = document.querySelector('.reservation-summary');
    if (reservationSummary) {
        // Retrieve data from localStorage
        const checkIn = localStorage.getItem('check_in');
        const checkOut = localStorage.getItem('check_out');
        const roomType = localStorage.getItem('room_type');
        const roomId = localStorage.getItem('room_id');

        // Update the summary elements if they exist
        const roomTypeElement = document.getElementById('roomType');
        const roomIdElement = document.getElementById('roomId');
        const checkInElement = document.getElementById('checkInDate');
        const checkOutElement = document.getElementById('checkOutDate');

        if (roomTypeElement) roomTypeElement.textContent = `Room Type: ${roomType || 'Not specified'}`;
        if (roomIdElement) roomIdElement.textContent = `Room ID: ${roomId || 'Not specified'}`;
        if (checkInElement) checkInElement.textContent = `Check-in Date: ${checkIn || 'Not specified'}`;
        if (checkOutElement) checkOutElement.textContent = `Check-out Date: ${checkOut || 'Not specified'}`;

        // Handle reservation form
        const reservationForm = document.getElementById('reservationForm');
        if (reservationForm) {
            reservationForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Get form values
                const name = document.getElementById('name')?.value;
                const email = document.getElementById('email')?.value;
                const contactNo = document.getElementById('contactNo')?.value;

                // Validate form
                if (!name || !email || !contactNo) {
                    alert('Please fill out all fields.');
                    return;
                }

                // Generate reservation ID and expiry
                const reservationId = generateUniqueReservationId();
                const expiryDate = generateExpiryDate();

                // Store reservation details
                localStorage.setItem('reservation_id', reservationId);
                localStorage.setItem('reservation_expiry', expiryDate);
                localStorage.setItem('guest_name', name);
                localStorage.setItem('guest_email', email);
                localStorage.setItem('guest_contact', contactNo);

                // Hide form and show confirmation
                reservationForm.style.display = 'none';
                const confirmationMessage = document.getElementById('confirmationMessage');
                if (confirmationMessage) {
                    confirmationMessage.style.display = 'block';
                    
                    // Update confirmation messages if elements exist
                    const idMessage = document.getElementById('reservationIdMessage');
                    const expiryMessage = document.getElementById('expiryDateMessage');
                    
                    if (idMessage) idMessage.textContent = `Your Reservation ID: ${reservationId}`;
                    if (expiryMessage) expiryMessage.textContent = `Reservation valid until: ${expiryDate}`;
                }
            });
        }
    }
});

// Handle reservation form submission
document.getElementById('reservationForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
        // Get form values
        const name = document.getElementById('name')?.value;
        const email = document.getElementById('email')?.value;
        const contactNo = document.getElementById('contact')?.value;
        
        // Get stored reservation details
        const checkIn = localStorage.getItem('check_in');
        const checkOut = localStorage.getItem('check_out');
        const roomType = localStorage.getItem('room_type');
        const roomId = localStorage.getItem('room_id');
        const numberOfGuests = localStorage.getItem('number_of_guests') || 1;

        // Generate reservation ID and expiry date
        const reservationId = generateUniqueReservationId();
        const expiryDate = generateExpiryDate();

        // Create reservation data object
        const reservationData = {
            reservationId,
            guestName: name,
            email,
            phone: contactNo,
            roomType,
            roomNumber: roomId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            numberOfGuests: parseInt(numberOfGuests),
            expiryDate: new Date(expiryDate),
            status: 'pending'
        };

        // Submit reservation to backend
        const reservation = await submitReservationToBackend(reservationData);
        console.log('Reservation created successfully:', reservation);

        // Store reservation details in localStorage
        localStorage.setItem('reservation_id', reservationId);
        localStorage.setItem('reservation_expiry', expiryDate);
        localStorage.setItem('guest_name', name);
        localStorage.setItem('guest_email', email);
        localStorage.setItem('guest_contact', contactNo);

        // Hide form and show confirmation
        document.getElementById('reservationForm').style.display = 'none';
        const confirmationMessage = document.getElementById('confirmationMessage');
        if (confirmationMessage) {
            confirmationMessage.style.display = 'block';
            
            // Update confirmation messages
            const idMessage = document.getElementById('reservationIdMessage');
            const expiryMessage = document.getElementById('expiryDateMessage');
            
            if (idMessage) idMessage.textContent = `Your Reservation ID: ${reservationId}`;
            if (expiryMessage) expiryMessage.textContent = `Reservation valid until: ${expiryDate}`;
        }
    } catch (error) {
        console.error('Error creating reservation:', error);
        alert('Failed to create reservation. Please try again.');
    }
});

// Function to submit reservation to backend
async function submitReservationToBackend(reservationData) {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create reservation');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting reservation:', error);
        throw error;
    }
}

// Handle reservation form in reservation.html
document.addEventListener('DOMContentLoaded', () => {
    const reservationForm = document.querySelector('.reservation form');
    if (reservationForm) {
        const checkInField = document.getElementById('check_in_reservation');
        const checkOutField = document.getElementById('check_out_reservation');
        
        // Get stored values
        const checkIn = localStorage.getItem('check_in');
        const checkOut = localStorage.getItem('check_out');
        const roomType = localStorage.getItem('room_type');
        const roomId = localStorage.getItem('room_id');

        // Set field values if they exist
        if (checkInField && checkIn) checkInField.value = checkIn;
        if (checkOutField && checkOut) checkOutField.value = checkOut;

        // Display room details
        const roomDetails = document.getElementById('roomDetails');
        if (roomDetails) {
            roomDetails.innerHTML = `
                <p>Room Type: ${roomType || 'Not specified'}</p>
                <p>Room ID: ${roomId || 'Not specified'}</p>
            `;
        }

        // Handle form submission
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Store the current data in localStorage
            if (checkInField && checkOutField) {
                localStorage.setItem('check_in', checkInField.value);
                localStorage.setItem('check_out', checkOutField.value);
                localStorage.setItem('room_type', roomType);
                localStorage.setItem('room_id', roomId);

                // Redirect to confirmation page
                window.location.href = 'confirmReservation.html';
            }
        });
    }
});

// Handle confirmation form in confirmReservation.html
document.addEventListener('DOMContentLoaded', () => {
    const confirmationForm = document.getElementById('reservationForm');
    if (confirmationForm) {
        // Handle form submission
        confirmationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values with null checks
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const contactInput = document.getElementById('contactNo');

            if (!nameInput || !emailInput || !contactInput) {
                console.error('Required form fields not found');
                return;
            }

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const contactNo = contactInput.value.trim();

            // Validate form
            if (!name || !email || !contactNo) {
                alert('Please fill out all fields.');
                return;
            }

            // Generate reservation ID and expiry
            const reservationId = generateUniqueReservationId();
            const expiryDate = generateExpiryDate();

            // Store reservation details
            localStorage.setItem('reservation_id', reservationId);
            localStorage.setItem('reservation_expiry', expiryDate);
            localStorage.setItem('guest_name', name);
            localStorage.setItem('guest_email', email);
            localStorage.setItem('guest_contact', contactNo);

            // Hide form and show confirmation
            confirmationForm.style.display = 'none';
            const confirmationMessage = document.getElementById('confirmationMessage');
            if (confirmationMessage) {
                confirmationMessage.style.display = 'block';
                
                // Update confirmation messages
                const idMessage = document.getElementById('reservationIdMessage');
                const expiryMessage = document.getElementById('expiryDateMessage');
                
                if (idMessage) idMessage.textContent = `Your Reservation ID: ${reservationId}`;
                if (expiryMessage) expiryMessage.textContent = `Reservation valid until: ${expiryDate}`;
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for room type selection
    const roomSelect = document.getElementById('roomSelect');
    const studentDormMessage = document.getElementById('studentDormMessage');
    
    if (roomSelect && studentDormMessage) {
        roomSelect.addEventListener('change', function() {
            // Show/hide message based on selection
            studentDormMessage.style.display = this.value === 'A' ? 'block' : 'none';
        });
    }
});

const ROOM_RATES = {
    'Student Dorm': { rate: 3000.00, per: 'month' },
    'Single Bedroom': { rate: 690.00, per: 'night' },
    'Double Bedroom': { rate: 1350.00, per: 'night' },
    'Family Room': { rate: 2000.00, per: 'night' },
    'Event Halls': { rate: 5000.00, per: 'day' }
};

function calculateTotalPrice(roomType, checkIn, checkOut) {
    if (!roomType || !checkIn || !checkOut) return { total: 0, duration: 0, per: 'night' };
    
    roomType = roomType.split(' - ')[0];
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const timeDiff = end.getTime() - start.getTime();
    let duration = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (roomType === 'Event Halls') {
        duration += 1;
    } else if (roomType === 'Student Dorm') {
        duration = Math.floor(duration / 30);
    }

    const rateInfo = ROOM_RATES[roomType];
    if (!rateInfo) return { total: 0, duration: 0, per: 'night' };

    return {
        total: rateInfo.rate * duration,
        duration: duration,
        per: rateInfo.per
    };
}

function formatCurrency(amount) {
    return amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Continue with form submission
            window.location.href = 'payment.html';
        });
    }
});
