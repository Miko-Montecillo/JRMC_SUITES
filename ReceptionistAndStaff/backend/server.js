const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connections
mongoose.set('strictQuery', false);

// Create a single connection to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/hotel_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    // Initialize collections after successful connection
    initializeDefaultUsers();
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// MongoDB connection error handling
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Define MongoDB model (StaffRequest)
const staffRequestSchema = new mongoose.Schema({
  type: String,
  customType: String,
  description: String,
  room: String,
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Define MongoDB model (Room)
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  guestName: String,
  status: { 
    type: String, 
    enum: ['Available', 'Occupied', 'Maintenance'],
    default: 'Available'
  },
  details: String
});

// Define MongoDB model (User)
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['receptionist', 'admin'],
    default: 'receptionist'
  }
});

// Define MongoDB model (Booking)
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  guestName: { type: String },
  email: { type: String },
  phone: String,
  roomType: { type: String, required: true },
  roomNumber: String,
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  numberOfGuests: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending'
  },
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define MongoDB model (Reservation)
const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true },
  guestName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  roomType: { type: String, required: true },
  roomNumber: String,
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  numberOfGuests: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiryDate: { type: Date, required: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define MongoDB model (Notification)
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['booking', 'reservation', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  relatedId: String,
  guestName: String,
  email: String,
  phone: String,
  roomType: String,
  roomNumber: String,
  checkIn: Date,
  checkOut: Date,
  paymentStatus: String,
  bookingStatus: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define MongoDB model (Invoice)
const invoiceSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  guestName: String,
  roomNumber: String,
  roomType: String,
  roomCategory: String,
  checkIn: Date,
  checkOut: Date,
  duration: Number,
  billingUnit: String,
  baseRate: Number,
  additionalCharges: [{ type: mongoose.Schema.Types.Mixed }],
  totalAdditionalCharges: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: ['generated', 'paid', 'cancelled'],
    default: 'generated'
  },
  generatedAt: Date
});

// Create models
const StaffRequest = mongoose.model('StaffRequest', staffRequestSchema);
const Room = mongoose.model('Room', roomSchema);
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

// API endpoint to fetch all staff requests
app.get('/api/staff-requests', async (req, res) => {
  try {
    const requests = await StaffRequest.find().sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Error fetching staff requests:', err);
    res.status(500).json({ message: 'Error fetching staff requests' });
  }
});

// API endpoint to fetch staff requests by category
app.get('/api/staff-requests/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const staffRequests = await StaffRequest.find({
      type: category,
      status: 'pending'
    }).sort({ timestamp: -1 });
    res.json(staffRequests);
  } catch (err) {
    console.error('Error fetching staff requests by category:', err);
    res.status(500).json({ message: 'Error fetching staff requests by category' });
  }
});

// API endpoint to create a new staff request
app.post('/api/staff-requests', async (req, res) => {
  try {
    const { type, customType, description, room, priority, status } = req.body;
    
    const newRequest = new StaffRequest({
      type,
      customType,
      description,
      room,
      priority,
      status: status || 'pending'
    });

    await newRequest.save();
    
    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Error creating staff request:', err);
    res.status(500).json({ message: 'Error creating staff request' });
  }
});

// API endpoint to update a staff request
app.patch('/api/staff-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Only allow updating certain fields
    const allowedUpdates = ['status', 'priority', 'description'];
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    const updatedRequest = await StaffRequest.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Staff request not found' });
    }

    res.json(updatedRequest);
  } catch (err) {
    console.error('Error updating staff request:', err);
    res.status(500).json({ message: 'Error updating staff request' });
  }
});

// API endpoint to delete a staff request
app.delete('/api/staff-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRequest = await StaffRequest.findByIdAndDelete(id);
    
    if (!deletedRequest) {
      return res.status(404).json({ message: 'Staff request not found' });
    }

    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (err) {
    console.error('Error deleting staff request:', err);
    res.status(500).json({ message: 'Error deleting staff request' });
  }
});

// API endpoint to mark a request as completed
app.patch('/api/staff-requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await StaffRequest.findByIdAndUpdate(
      id, 
      { status: 'completed' },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Staff request not found' });
    }

    res.status(200).json({ message: 'Request completed successfully', request: updatedRequest });
  } catch (err) {
    console.error('Error completing staff request:', err);
    res.status(500).json({ message: 'Error completing staff request' });
  }
});

// API endpoint to get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    console.log(`Fetched ${rooms.length} rooms`);
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// API endpoint for check-in
app.post('/api/rooms/check-in', async (req, res) => {
  try {
    const { roomNumber, guestName } = req.body;
    
    if (!roomNumber || !guestName) {
      return res.status(400).json({ message: 'Room number and guest name are required' });
    }

    const room = await Room.findOneAndUpdate(
      { roomNumber },
      { 
        status: 'Occupied',
        guestName
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ message: 'Error checking in' });
  }
});

// API endpoint for check-out
app.post('/api/rooms/check-out', async (req, res) => {
  try {
    const { roomNumber } = req.body;
    
    if (!roomNumber) {
      return res.status(400).json({ message: 'Room number is required' });
    }

    const room = await Room.findOne({ roomNumber });
    
    if (!room) {
      console.error(`Room not found: ${roomNumber}`);
      return res.status(404).json({ message: `Room ${roomNumber} not found` });
    }

    if (room.status !== 'Occupied') {
      return res.status(400).json({ message: `Room ${roomNumber} is not occupied` });
    }

    // Store only guest name and room number for checkout summary
    const checkOutData = {
      Guest: room.guestName,
      Room: roomNumber
    };

    room.status = 'Available';
    room.guestName = '';
    
    await room.save();
    res.json(checkOutData);
  } catch (err) {
    console.error('Error during check-out:', err);
    res.status(500).json({ message: 'Error processing check-out' });
  }
});

// API endpoint to update room status
app.patch('/api/rooms/:roomNumber/status', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const room = await Room.findOne({ roomNumber });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.status = status;
    
    await room.save();
    res.json(room);
  } catch (err) {
    console.error('Error updating room status:', err);
    res.status(500).json({ message: 'Error updating room status' });
  }
});

// Update room details
app.patch('/api/rooms/:roomNumber/details', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { details } = req.body;

    const room = await Room.findOne({ roomNumber });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.details = details;
    await room.save();

    res.json({ message: 'Room details updated successfully', room });
  } catch (error) {
    console.error('Error updating room details:', error);
    res.status(500).json({ message: 'Failed to update room details' });
  }
});

// API endpoint to check room status
app.get('/api/rooms/:roomNumber/status', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const room = await Room.findOne({ roomNumber });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ 
      status: room.status,
      isAvailable: room.status === 'Available'
    });
  } catch (err) {
    console.error('Error checking room status:', err);
    res.status(500).json({ message: 'Error checking room status' });
  }
});

// API endpoint to fetch bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { roomNumber, status, sort = 'desc' } = req.query;
    let query = {};
    
    // Add filters if provided
    if (roomNumber) query.roomNumber = roomNumber;
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    
    const bookings = await Booking.find(query)
      .sort({ checkIn: sort === 'desc' ? -1 : 1 })
      .select({
        bookingId: 1,
        guestName: 1,
        email: 1,
        phone: 1,
        roomNumber: 1,
        roomType: 1,
        checkIn: 1,
        checkOut: 1,
        status: 1,
        paymentStatus: 1,
        specialRequests: 1
      });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get a specific booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// Update a booking
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const updates = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update room status if booking status changed to checked-in
    if (updates.status === 'checked-in' && booking.roomNumber) {
      await Room.findOneAndUpdate(
        { roomNumber: booking.roomNumber },
        { 
          status: 'Occupied',
          guestName: booking.guestName
        }
      );
      
      // Create notification for check-in
      await createNotification(
        'booking',
        'Guest Check-In',
        `${booking.guestName} has checked in to room ${booking.roomNumber}`,
        {
          guestName: booking.guestName,
          email: booking.email,
          phone: booking.phone,
          roomType: booking.roomType,
          roomNumber: booking.roomNumber,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          paymentStatus: booking.paymentStatus,
          status: booking.status
        },
        'medium',
        booking._id
      );
    }
    
    // Update room status if booking status changed to checked-out
    if (updates.status === 'checked-out' && booking.roomNumber) {
      await Room.findOneAndUpdate(
        { roomNumber: booking.roomNumber },
        { 
          status: 'Available',
          guestName: ''
        }
      );
      
      // Create notification for check-out
      await createNotification(
        'booking',
        'Guest Check-Out',
        `${booking.guestName} has checked out from room ${booking.roomNumber}`,
        {
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status
        },
        'medium',
        booking._id
      );
    }
    
    res.json(booking);
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    if (!bookingData.guestName || !bookingData.roomType || !bookingData.roomNumber || !bookingData.checkIn || !bookingData.checkOut) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if room is available
    const room = await Room.findOne({ roomNumber: bookingData.roomNumber });
    if (!room || room.status !== 'Available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Create new booking
    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Update room status
    await Room.findOneAndUpdate(
      { roomNumber: bookingData.roomNumber },
      { 
        status: 'Occupied',
        guestName: bookingData.guestName
      }
    );

    // Create notification for new booking
    await createNotification(
      'booking',
      'New Booking',
      `New booking created for ${bookingData.guestName}`,
      {
        guestName: bookingData.guestName,
        email: bookingData.email,
        phone: bookingData.phone,
        roomType: bookingData.roomType,
        roomNumber: bookingData.roomNumber,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        status: bookingData.status
      },
      'medium',
      newBooking._id
    );

    res.status(201).json(newBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Failed to process booking. Please try again.' });
  }
});

// Create a new reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const reservationData = {
      reservationId: req.body.reservationId,
      guestName: req.body.guestName?.trim(),
      email: req.body.email?.trim().toLowerCase(),
      phone: req.body.phone?.trim(),
      roomType: req.body.roomType,
      roomNumber: req.body.roomNumber,
      checkIn: new Date(req.body.checkIn),
      checkOut: new Date(req.body.checkOut),
      numberOfGuests: parseInt(req.body.numberOfGuests) || 1,
      expiryDate: new Date(req.body.expiryDate),
      status: 'pending'
    };

    // Validate required fields
    if (!reservationData.guestName || !reservationData.email || !reservationData.roomType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if a reservation with the same ID already exists
    const existingReservation = await Reservation.findOne({ reservationId: reservationData.reservationId });
    if (existingReservation) {
      return res.status(400).json({ message: 'Reservation ID already exists' });
    }

    const newReservation = new Reservation(reservationData);
    await newReservation.save();
    
    // Create notification for new reservation
    await createNotification(
      'reservation',
      'New Reservation Request',
      `New reservation request from ${reservationData.guestName} for room type ${reservationData.roomType}`,
      {
        guestName: reservationData.guestName,
        email: reservationData.email,
        phone: reservationData.phone,
        roomType: reservationData.roomType,
        roomNumber: reservationData.roomNumber,
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        status: reservationData.status
      },
      'medium',
      newReservation._id
    );
    
    // Clear any sensitive data before sending response
    const reservationResponse = newReservation.toObject();
    delete reservationResponse.__v;

    res.status(201).json(reservationResponse);
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

// Get reservation by ID
app.get('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ reservationId: req.params.id });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (err) {
    console.error('Error fetching reservation:', err);
    res.status(500).json({ message: 'Error fetching reservation' });
  }
});

// Update reservation status
app.patch('/api/reservations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: id },
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Create notification for reservation status change
    const notificationMessages = {
      'confirmed': 'Reservation has been confirmed',
      'cancelled': 'Reservation has been cancelled',
      'expired': 'Reservation has expired'
    };

    if (notificationMessages[status]) {
      await createNotification(
        'reservation',
        `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `${notificationMessages[status]} for ${reservation.guestName}`,
        {
          guestName: reservation.guestName,
          email: reservation.email,
          phone: reservation.phone,
          roomType: reservation.roomType,
          roomNumber: reservation.roomNumber,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          status: reservation.status
        },
        status === 'cancelled' ? 'high' : 'medium',
        reservation._id
      );
    }

    res.json(reservation);
  } catch (err) {
    console.error('Error updating reservation status:', err);
    res.status(500).json({ message: 'Error updating reservation status' });
  }
});

// Delete expired reservations (can be called by a cron job)
app.delete('/api/reservations/expired', async (req, res) => {
  try {
    const result = await Reservation.deleteMany({
      expiryDate: { $lt: new Date() },
      status: 'pending'
    });
    res.json({ message: `Deleted ${result.deletedCount} expired reservations` });
  } catch (err) {
    console.error('Error deleting expired reservations:', err);
    res.status(500).json({ message: 'Error deleting expired reservations' });
  }
});

// API endpoint to fetch notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    let notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    // Fetch associated bookings and reservations to get latest room numbers
    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      const notifObj = notification.toObject();
      
      if (notification.type === 'booking' && notification.relatedId) {
        const booking = await Booking.findById(notification.relatedId);
        if (booking) {
          notifObj.roomNumber = booking.roomNumber;
          notifObj.bookingStatus = booking.status;
          notifObj.paymentStatus = booking.paymentStatus;
        }
      } else if (notification.type === 'reservation' && notification.relatedId) {
        const reservation = await Reservation.findById(notification.relatedId);
        if (reservation) {
          notifObj.roomNumber = reservation.roomNumber;
          notifObj.bookingStatus = reservation.status;
        }
      }
      
      return notifObj;
    }));
    
    res.json(populatedNotifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// API endpoint to mark notifications as read
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { status: 'read' },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(updatedNotification);
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// API endpoint to mark all notifications as read
app.patch('/api/notifications/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { status: 'unread' },
      { status: 'read' }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// API endpoint to delete a notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await Notification.findByIdAndDelete(id);
    
    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// API endpoint for staff registration
app.post('/api/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const { username, password, adminKey, role } = req.body;

    // Basic validation
    if (!username || !password || !adminKey) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, and admin key are required' 
      });
    }

    // Verify admin key
    const validAdminKey = process.env.ADMIN_KEY || 'admin123';
    console.log('Validating admin key:', { provided: adminKey, valid: validAdminKey });
    if (adminKey !== validAdminKey) {
      console.log('Invalid admin key provided');
      return res.status(401).json({ success: false, message: 'Invalid admin key' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    console.log('Checking existing user:', { exists: !!existingUser });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Create new user
    const newUser = new User({
      username,
      password,
      role: role || 'receptionist'
    });

    console.log('Attempting to save new user');
    await newUser.save();
    console.log('User saved successfully');

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error during registration',
      error: err.message 
    });
  }
});

// Authentication endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Room rate configuration
const roomRates = {
  'A': { rate: 3000.00, billingUnit: 'month', category: 'Student Dorm' },
  'B': { rate: 690.00, billingUnit: 'night', category: 'Single Room' },
  'C': { rate: 1350.00, billingUnit: 'night', category: 'Double Room' },
  'D': { rate: 2000.00, billingUnit: 'night', category: 'Family Room' },
  'E': { rate: 5000.00, billingUnit: 'day', category: 'Event Hall' }
};

// Generate invoice for a booking
app.post('/api/invoices/generate', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get room type and rates
    const roomType = booking.roomNumber.charAt(0);
    const { rate, billingUnit, category } = roomRates[roomType];

    // Calculate duration based on billing unit
    const checkIn = new Date(booking.checkIn);
    const checkOut = booking.checkOut ? new Date(booking.checkOut) : new Date();
    let duration;

    if (billingUnit === 'month') {
      // For monthly rates (student dorm), calculate full months
      const months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + 
                    (checkOut.getMonth() - checkIn.getMonth());
      const remainingDays = checkOut.getDate() - checkIn.getDate();
      duration = months + (remainingDays > 0 ? 1 : 0); // Round up to next month if there are remaining days
    } else if (billingUnit === 'day') {
      // For daily rates (event halls), include both check-in and check-out days
      duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // For nightly rates, calculate nights between check-in and check-out
      duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }

    // Calculate base amount and total
    const baseAmount = rate * duration;
    const additionalCharges = booking.additionalCharges || [];
    const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    const totalAmount = baseAmount + totalAdditionalCharges;

    // Create invoice
    const invoice = new Invoice({
      bookingId: booking._id,
      guestName: booking.guestName,
      roomNumber: booking.roomNumber,
      roomType: category,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut || new Date(),
      duration,
      billingUnit,
      baseRate: rate,
      additionalCharges,
      totalAdditionalCharges,
      totalAmount,
      status: 'generated',
      generatedAt: new Date()
    });

    await invoice.save();
    res.json({ invoice });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API endpoint to get invoice history
app.get('/api/invoices', async (req, res) => {
  try {
    const { roomNumber, guestName, startDate, endDate } = req.query;
    
    let query = {};
    
    if (roomNumber) query.roomNumber = roomNumber;
    if (guestName) query.guestName = new RegExp(guestName, 'i');
    
    if (startDate || endDate) {
      query.generatedAt = {};
      if (startDate) query.generatedAt.$gte = new Date(startDate);
      if (endDate) query.generatedAt.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .sort({ generatedAt: -1 })
      .limit(100);

    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Error fetching invoice history' });
  }
});

// Function to create a notification
async function createNotification(type, title, message, data = {}, priority = 'medium', relatedId = null) {
  try {
    // First, get the latest data from the database
    let latestData = { ...data };
    
    if (type === 'booking' && relatedId) {
      const booking = await Booking.findById(relatedId);
      if (booking) {
        latestData = {
          ...latestData,
          roomNumber: booking.roomNumber,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        };
      }
    } else if (type === 'reservation' && relatedId) {
      const reservation = await Reservation.findById(relatedId);
      if (reservation) {
        latestData = {
          ...latestData,
          roomNumber: reservation.roomNumber,
          status: reservation.status
        };
      }
    }

    const notification = new Notification({
      type,
      title,
      message,
      priority,
      relatedId,
      guestName: latestData.guestName,
      email: latestData.email,
      phone: latestData.phone,
      roomType: latestData.roomType,
      roomNumber: latestData.roomNumber,
      checkIn: latestData.checkIn,
      checkOut: latestData.checkOut,
      paymentStatus: latestData.paymentStatus,
      bookingStatus: latestData.status
    });
    
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

// Function to create notifications for existing data
async function createNotificationsForExistingData() {
  try {
    // Get all notifications to check what we already have
    const existingNotifications = await Notification.find();
    const notifiedIds = new Set(existingNotifications.map(n => n.relatedId?.toString()));

    // Check bookings
    const bookings = await Booking.find();
    for (const booking of bookings) {
      if (!notifiedIds.has(booking._id.toString())) {
        await createNotification(
          'booking',
          'New Booking',
          `New booking for ${booking.roomType}${booking.roomNumber ? ` - Room ${booking.roomNumber}` : ''}`,
          {
            guestName: booking.guestName,
            email: booking.email,
            phone: booking.phone,
            roomType: booking.roomType,
            roomNumber: booking.roomNumber,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            paymentStatus: booking.paymentStatus,
            status: booking.status
          },
          'medium',
          booking._id
        );
      }
    }

    // Check reservations
    const reservations = await Reservation.find();
    for (const reservation of reservations) {
      if (!notifiedIds.has(reservation._id.toString())) {
        await createNotification(
          'reservation',
          'New Reservation',
          `New reservation for ${reservation.roomType}${reservation.roomNumber ? ` - Room ${reservation.roomNumber}` : ''}`,
          {
            guestName: reservation.guestName,
            email: reservation.email,
            phone: reservation.phone,
            roomType: reservation.roomType,
            roomNumber: reservation.roomNumber,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            status: reservation.status
          },
          'medium',
          reservation._id
        );
      }
    }

    console.log('Successfully created notifications for existing data');
  } catch (error) {
    console.error('Error creating notifications for existing data:', error);
  }
}

// Initialize default users if they don't exist
async function initializeDefaultUsers() {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      // Create default admin user
      const defaultAdmin = new User({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      await defaultAdmin.save();
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
}

// Initialize rooms if they don't exist
async function initializeRooms() {
  try {
    console.log('Starting room initialization check...');
    const count = await Room.countDocuments();
    console.log(`Current room count: ${count}`);

    if (count === 0) {
      console.log('No rooms found. Creating initial rooms...');
      const roomNumbers = [
        // Student Dorm
        'A101', 'A102', 'A103', 'A104', 'A105', 'A106', 'A107', 'A108', 'A109', 'A110',
        'A201', 'A202', 'A203', 'A204', 'A205',
        // Single Room
        'B206', 'B207', 'B208', 'B209', 'B210', 'B301', 'B302', 'B303', 'B304', 'B305',
        'B306', 'B307',
        // Double Room
        'C308', 'C309', 'C310', 'C401', 'C402', 'C403', 'C404', 'C405', 'C406', 'C407',
        'C408', 'C409',
        // Family Room
        'D410', 'D501', 'D502', 'D503', 'D504', 'D505', 'D506', 'D507', 'D508',
        // Event Halls
        'E601', 'E701'
      ];

      const rooms = roomNumbers.map(roomNumber => ({
        roomNumber,
        status: 'Available',
        details: '',
        guestName: ''
      }));

      await Room.insertMany(rooms);
      console.log(`Successfully initialized ${rooms.length} rooms`);
    } else {
      console.log('Rooms already exist in database');
    }
  } catch (err) {
    console.error('Error during room initialization:', err);
    throw err;
  }
}

// Start the server and initialize rooms
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    // Initialize rooms
    await initializeRooms();
    // Initialize default users
    await initializeDefaultUsers();
    // Create notifications for existing data
    await createNotificationsForExistingData();
    
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Error during server initialization:', error);
  }
});
