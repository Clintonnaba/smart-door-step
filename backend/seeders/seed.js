require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const { sequelize, User, Service } = require('../models');

async function seed() {
  await sequelize.sync({ force: true });

  // Users
  const password = await bcrypt.hash('password123', 10);
  await User.bulkCreate([
    { name: 'Alice', email: 'alice@example.com', password, role: 'user' },
    { name: 'Bob', email: 'bob@example.com', password, role: 'provider' },
    { name: 'Admin', email: 'admin@example.com', password, role: 'admin' },
  ]);

  // Services
  await Service.bulkCreate([
    { name: 'Plumbing', description: 'All plumbing services', category: 'Home', basePrice: 50 },
    { name: 'Electrical', description: 'Electrical repairs and installations', category: 'Home', basePrice: 60 },
    { name: 'Cleaning', description: 'Home and office cleaning', category: 'Cleaning', basePrice: 40 },
    { name: 'AC Repair', description: 'Air conditioner repair and maintenance', category: 'Home', basePrice: 80 },
  ]);

  console.log('Database seeded!');
  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
