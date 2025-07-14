exports.getAllBookings = (req, res) => {
  res.json({ message: "Get all bookings" });
};

exports.getBookingById = (req, res) => {
  res.json({ message: `Get booking by ID: ${req.params.id}` });
};

exports.createBooking = (req, res) => {
  res.json({ message: "Create booking" });
};

exports.updateBooking = (req, res) => {
  res.json({ message: `Update booking ID: ${req.params.id}` });
};

exports.deleteBooking = (req, res) => {
  res.json({ message: `Delete booking ID: ${req.params.id}` });
};
