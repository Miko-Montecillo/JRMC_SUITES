// Room rates per night/month
const ROOM_RATES = {
    'Student Dorm': { rate: 3000.00, per: 'month' },
    'Single Bedroom': { rate: 690.00, per: 'night' },
    'Double Bedroom': { rate: 1350.00, per: 'night' },
    'Family Room': { rate: 2000.00, per: 'night' },
    'Event Halls': { rate: 5000.00, per: 'day' }
};

// Remove the room type suffix (e.g., "Single Bedroom - B" -> "Single Bedroom")
function normalizeRoomType(roomType) {
    if (!roomType) return '';
    const normalized = roomType.split(' - ')[0];
    console.log('Normalizing room type:', { original: roomType, normalized });
    return normalized;
}

// Calculate the number of days/months between two dates
function calculateDuration(checkIn, checkOut, roomType) {
    console.log('Calculating duration for:', { checkIn, checkOut, roomType });
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    // Set times to midnight to ensure accurate day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const timeDiff = end.getTime() - start.getTime();
    let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    console.log('Initial days calculation:', { 
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        daysDiff 
    });

    let finalDuration;
    // For Event Halls, we count the actual days including both check-in and check-out days
    if (roomType.includes('Event Halls')) {
        finalDuration = daysDiff + 1; // Include both start and end day
        console.log('Event Hall duration:', { daysDiff, finalDuration });
    }
    // For Student Dorm, convert to months
    else if (roomType.includes('Student Dorm')) {
        finalDuration = Math.ceil(daysDiff / 30); // Convert to months
        console.log('Student Dorm duration:', { daysDiff, months: finalDuration });
    }
    // For rooms charged per night, we count the nights stayed
    else {
        finalDuration = daysDiff;
        console.log('Regular room duration (nights):', finalDuration);
    }

    return finalDuration;
}

// Format currency to PHP
function formatCurrency(amount) {
    return `₱${amount.toFixed(2)}`;
}

// Calculate total price based on room type and duration
function calculateTotalPrice(roomType, checkIn, checkOut) {
    console.log('Starting price calculation for:', { roomType, checkIn, checkOut });
    
    // Normalize the room type by removing the suffix
    const normalizedRoomType = normalizeRoomType(roomType);
    console.log('Using normalized room type:', normalizedRoomType);

    if (!ROOM_RATES[normalizedRoomType]) {
        console.error('Invalid room type:', roomType, 'Normalized:', normalizedRoomType);
        console.log('Available room types:', Object.keys(ROOM_RATES));
        return {
            total: 0,
            duration: 0,
            per: 'day'
        };
    }

    const duration = calculateDuration(checkIn, checkOut, normalizedRoomType);
    const { rate, per } = ROOM_RATES[normalizedRoomType];
    const total = rate * duration;

    console.log('Price calculation results:', {
        normalizedRoomType,
        duration,
        rate,
        per,
        total
    });

    return {
        total: total,
        duration: duration,
        per: per
    };
}

// Update the booking summary in the payment page
function updateBookingSummary() {
    console.log('Starting updateBookingSummary');
    // Only run this code on the payment page
    if (!document.getElementById('totalPrice')) {
        console.log('Not on payment page, exiting');
        return;
    }

    // Get booking details from localStorage
    const roomType = localStorage.getItem('room_type');
    const roomId = localStorage.getItem('room_id');
    const checkIn = localStorage.getItem('check_in');
    const checkOut = localStorage.getItem('check_out');

    console.log('Retrieved from localStorage:', {
        roomType,
        roomId,
        checkIn,
        checkOut
    });

    // Update room details
    document.querySelector('#roomType span').textContent = roomType || 'N/A';
    document.querySelector('#roomId span').textContent = roomId || 'N/A';
    document.querySelector('#checkInDate span').textContent = checkIn || 'N/A';
    document.querySelector('#checkOutDate span').textContent = checkOut || 'N/A';

    // Calculate and update total price
    if (roomType && checkIn && checkOut) {
        const { total, duration, per } = calculateTotalPrice(roomType, checkIn, checkOut);
        
        console.log('Final calculation results:', {
            total,
            duration,
            per,
            formattedTotal: formatCurrency(total)
        });

        const totalPriceText = `${formatCurrency(total)} (${duration} ${per}${duration > 1 ? 's' : ''})`;
        document.querySelector('#totalPrice span').textContent = totalPriceText;
        
        // Store the total price in localStorage for later use
        localStorage.setItem('total_price', total);
    } else {
        console.log('Missing required booking details');
        document.querySelector('#totalPrice span').textContent = 'N/A';
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', updateBookingSummary);

// Add storage event listener to update price when localStorage changes
window.addEventListener('storage', function(e) {
    if (['room_type', 'check_in', 'check_out'].includes(e.key)) {
        console.log('Storage changed:', e.key);
        updateBookingSummary();
    }
});

// Run updateBookingSummary every time the page gains focus
window.addEventListener('focus', updateBookingSummary);
