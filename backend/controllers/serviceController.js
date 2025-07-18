const { Service, User } = require('../models');

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [
        {
          model: User,
          as: 'technicians',
          attributes: ['id', 'fullName'],
          through: { attributes: [] }, // exclude join table
        },
      ],
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
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
