require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database'); // Adjust if path differs

// Import your models
const { Admin, Technician, Service, User } = require('../models'); // Adjust if needed

// List of technician names
const technicianNames = [
  'Aayush', 'Abeer', 'Abhay', 'Anisha', 'Aakriti', 'Bibek', 'Bikash', 'Bishal',
  'Chandani', 'Dipesh', 'Gita', 'Himal', 'Ishwor', 'Janak', 'Kabita', 'Laxman',
  'Manish', 'Nabin', 'Ojaswi', 'Pooja', 'Rajesh', 'Sarita', 'Suman', 'Tika',
  'Umesh', 'Vikram', 'Yamuna', 'Zia', 'Pratik', 'Samjhana'
];

// List of services
const services = ['Plumbing', 'Electrical', 'Painting', 'AC Repair', 'House Cleaning'];

const femaleNames = [
  'Anisha', 'Aakriti', 'Chandani', 'Gita', 'Kabita', 'Pooja', 'Sarita', 'Samjhana', 'Tika', 'Yamuna', 'Zia', 'Janak', 'Manita', 'Sunita', 'Puja', 'Sita', 'Gita', 'Bibek', 'Aakriti', 'Kabita', 'Samjhana', 'Sarita', 'Chandani', 'Gita', 'Pooja', 'Yamuna', 'Zia', 'Abeer', 'Aayush', 'Anisha', 'Aakriti', 'Kabita', 'Samjhana', 'Sarita', 'Chandani', 'Gita', 'Pooja', 'Yamuna', 'Zia'
];

const seed = async () => {
  try {
    await sequelize.sync();

    // ✅ Seed Admin
    const adminExists = await Admin.findOne({ where: { email: 'clintonadmin@gmail.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('nklnkl', 10);
      await Admin.create({
        name: 'Clinton Admin',
        email: 'clintonadmin@gmail.com',
        password: hashedPassword,
        phone: '9800000000',
        location: 'Kathmandu',
        age: 30
      });
      console.log('✅ Admin created');
    } else {
      console.log('✅ Admin already exists');
    }

    // 3. Services
    const serviceData = [
      {
        name: 'Plumbing',
        description: 'Fixing and installing pipes, faucets, and drains.',
        category: 'Home Repair',
        basePrice: 1500
      },
      {
        name: 'Electrical',
        description: 'Wiring, lighting, fan installation, and electrical maintenance.',
        category: 'Home Repair',
        basePrice: 2000
      },
      {
        name: 'Painting',
        description: 'Interior and exterior painting for homes and buildings.',
        category: 'Renovation',
        basePrice: 2500
      },
      {
        name: 'AC Repair',
        description: 'AC servicing, gas refilling, and maintenance.',
        category: 'Appliance Repair',
        basePrice: 3000
      },
      {
        name: 'House Cleaning',
        description: 'Deep cleaning of rooms, kitchens, bathrooms, and floors.',
        category: 'Cleaning',
        basePrice: 1800
      }
    ];
    const existingServices = await Service.count();
    if (existingServices < serviceData.length) {
      for (const service of serviceData) {
        const exists = await Service.findOne({ where: { name: service.name } });
        if (!exists) {
          await Service.create(service);
        }
      }
      console.log('✅ Services seeded');
    } else {
      console.log('✅ Services already exist');
    }

    // ✅ Seed Technicians
    const technicianCount = await Technician.count();
    if (technicianCount === 0) {
      const techs = await Promise.all(
        technicianNames.map(async (name) => ({
          name,
          email: `${name.toLowerCase()}tech@gmail.com`,
          password: await bcrypt.hash('nklnkl', 10),
          phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
          location: ['Kathmandu', 'Pokhara', 'Chitwan'][Math.floor(Math.random() * 3)],
          age: Math.floor(Math.random() * 30 + 20),
          gender: femaleNames.includes(name) ? 'female' : 'male',
        }))
      );
      await Technician.bulkCreate(techs);
      console.log('✅ Technicians seeded');
    } else {
      console.log('✅ Technicians already exist');
    }

    // ✅ Seed Customer User
    const customerEmail = 'neupaneclinton@gmail.com';
    const customerExists = await User.findOne({ where: { email: customerEmail } });
    if (!customerExists) {
      const hashedPassword = await bcrypt.hash('nklnkl', 10);
      await User.create({
        fullName: 'Clinton Neupane',
        email: customerEmail,
        password: hashedPassword,
        phone: '9741841501',
        role: 'user'
      });
      console.log('✅ Customer user seeded');
    } else {
      console.log('✅ Customer user already exists');
    }

    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
