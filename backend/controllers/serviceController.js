exports.getAllServices = (req, res) => {
  res.json({ message: "Get all services" });
};

exports.getServiceById = (req, res) => {
  res.json({ message: `Get service by ID: ${req.params.id}` });
};

exports.createService = (req, res) => {
  res.json({ message: "Create service" });
};

exports.updateService = (req, res) => {
  res.json({ message: `Update service ID: ${req.params.id}` });
};

exports.deleteService = (req, res) => {
  res.json({ message: `Delete service ID: ${req.params.id}` });
};
