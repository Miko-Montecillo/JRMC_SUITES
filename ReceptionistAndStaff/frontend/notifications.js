// Notification handling functions
let notifications = {
    unread: [],
    read: []
};

// Fetch notifications from the server
async function fetchNotifications() {
    try {
        const response = await fetch('http://localhost:3000/api/notifications');
        const allNotifications = await response.json();
        
        // Sort notifications by status and type
        notifications.unread = allNotifications.filter(n => n.status === 'unread');
        notifications.read = allNotifications.filter(n => n.status === 'read');
        
        // Update the UI
        updateNotificationsUI();
    } catch (error) {
        console.error('Error fetching notifications:', error);
        showError('Failed to fetch notifications');
    }
}

// Update the notifications UI
function updateNotificationsUI() {
    const bookingNotifications = notifications.unread.concat(notifications.read)
        .filter(n => n.type === 'booking')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const reservationNotifications = notifications.unread.concat(notifications.read)
        .filter(n => n.type === 'reservation')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Update notification counts
    document.getElementById('booking-unread-count').textContent = 
        bookingNotifications.filter(n => n.status === 'unread').length;
    document.getElementById('reservation-unread-count').textContent = 
        reservationNotifications.filter(n => n.status === 'unread').length;
    
    updateNotificationSection('booking-notifications', bookingNotifications);
    updateNotificationSection('reservation-notifications', reservationNotifications);
}

// Mark a notification as read
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            // Refresh notifications after marking as read
            await fetchNotifications();
        } else {
            throw new Error('Failed to mark notification as read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showError('Failed to mark notification as read');
    }
}

// Mark all notifications of a specific type as read
async function markAllAsRead(type) {
    try {
        const unreadNotifications = notifications.unread.filter(n => n.type === type);
        for (const notification of unreadNotifications) {
            await markAsRead(notification._id);
        }
        await fetchNotifications(); // Refresh the notifications
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Delete a notification
async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Refresh notifications after deletion
            await fetchNotifications();
        } else {
            throw new Error('Failed to delete notification');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showError('Failed to delete notification');
    }
}

// Update a specific notification section
function updateNotificationSection(sectionId, notificationsList) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.innerHTML = '';

    notificationsList.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification ${notification.status === 'unread' ? 'unread' : 'read'}`;
        
        let detailsHTML = '';
        if (notification.type === 'booking') {
            detailsHTML = `
                <div class="notification-details">
                    <p><strong>Guest Name:</strong> ${notification.guestName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${notification.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${notification.phone || 'N/A'}</p>
                    <p><strong>Room Type:</strong> ${notification.roomType || 'N/A'}</p>
                    <p><strong>Room Number:</strong> ${notification.roomNumber || 'Not Assigned'}</p>
                    <p><strong>Check In:</strong> ${notification.checkIn ? new Date(notification.checkIn).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Check Out:</strong> ${notification.checkOut ? new Date(notification.checkOut).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Status:</strong> ${notification.bookingStatus || 'N/A'}</p>
                    <p><strong>Payment Status:</strong> ${notification.paymentStatus || 'N/A'}</p>
                </div>`;
        } else if (notification.type === 'reservation') {
            detailsHTML = `
                <div class="notification-details">
                    <p><strong>Guest Name:</strong> ${notification.guestName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${notification.email || 'N/A'}</p>
                    <p><strong>Room Type:</strong> ${notification.roomType || 'N/A'}</p>
                    <p><strong>Room Number:</strong> ${notification.roomNumber || 'Not Assigned'}</p>
                    <p><strong>Check In:</strong> ${notification.checkIn ? new Date(notification.checkIn).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Check Out:</strong> ${notification.checkOut ? new Date(notification.checkOut).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Status:</strong> ${notification.bookingStatus || 'N/A'}</p>
                </div>`;
        } else {
            detailsHTML = `
                <div class="notification-details">
                    <p>${notification.message || ''}</p>
                </div>`;
        }

        notificationElement.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${notification.title || 'Notification'}</span>
                <span class="notification-time">${new Date(notification.timestamp).toLocaleString()}</span>
            </div>
            ${detailsHTML}
            <div class="notification-actions">
                ${notification.status === 'unread' ? 
                    `<button onclick="markAsRead('${notification._id}')" class="mark-read-btn">MARK AS READ</button>` : 
                    ''
                }
                <button onclick="deleteNotification('${notification._id}')" class="delete-btn">DELETE</button>
            </div>
        `;

        section.appendChild(notificationElement);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    // Find the notifications section
    const section = document.getElementById('notifications-section');
    if (section) {
        section.insertBefore(errorDiv, section.firstChild);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize notifications when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    setInterval(fetchNotifications, 30000);
});
