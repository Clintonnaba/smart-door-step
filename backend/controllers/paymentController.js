exports.getAllPayments = (req, res) => {
  res.json({ message: "Get all payments" });
};

exports.getPaymentById = (req, res) => {
  res.json({ message: `Get payment by ID: ${req.params.id}` });
};

exports.createPayment = (req, res) => {
  res.json({ message: "Create payment" });
};
