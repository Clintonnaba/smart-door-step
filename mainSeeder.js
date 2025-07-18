const bcrypt = require('bcrypt');
const { sequelize, Admin, Technician, Service } = require('./backend/models');

async function main() {
  try {
    await sequelize.authenticate();
    // 1. Admin
    const adminEmail = 'clintonadmin@gmail.com';
    const adminExists = await Admin.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('nklnkl', 10);
      await Admin.create({
        name: 'Clinton Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '9800000000',
        location: 'Kathmandu',
        age: 30
      });
      console.log('Admin inserted');
    } else {
      console.log('Admin already exists');
    }

    // 2. Technicians
    const techCount = await Technician.count();
    if (techCount < 30) {
      const techNames = [
        'Aayush', 'Abeer', 'Abhay', 'Anisha', 'Aakriti', 'Bibek', 'Bikash', 'Bishal', 'Chandani', 'Dipesh',
        'Gita', 'Himal', 'Ishwor', 'Janak', 'Kabita', 'Laxman', 'Manish', 'Nabin', 'Ojaswi', 'Pooja',
        'Rajesh', 'Sarita', 'Suman', 'Tika', 'Umesh', 'Vikram', 'Yamuna', 'Zia', 'Pratik', 'Samjhana'
      ];
      const cities = ['Kathmandu', 'Pokhara', 'Chitwan', 'Biratnagar', 'Butwal', 'Dharan', 'Nepalgunj', 'Birgunj', 'Hetauda', 'Bhaktapur'];
      const techPassword = await bcrypt.hash('nklnkl', 10);
      const techDocs = techNames.map(name => ({
        name,
        email: `${name.toLowerCase()}tech@gmail.com`,
        password: techPassword,
        role: 'technician',
        phone: '98' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        location: cities[Math.floor(Math.random() * cities.length)],
        age: Math.floor(20 + Math.random() * 31)
      }));
      await Technician.bulkCreate(techDocs);
      console.log('Technicians inserted');
    } else {
      console.log('Technicians already exist');
    }

    // 3. Services
    const serviceNames = ['Plumbing', 'Electrical', 'Painting', 'AC Repair', 'House Cleaning'];
    const existingServices = await Service.count();
    if (existingServices < serviceNames.length) {
      for (const name of serviceNames) {
        const exists = await Service.findOne({ where: { name } });
        if (!exists) {
          await Service.create({ name });
        }
      }
      console.log('Services inserted');
    } else {
      console.log('Services already exist');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

main(); 