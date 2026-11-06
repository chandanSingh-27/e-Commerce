const path = require('path');
const dns = require('dns');

// Fix for Windows & local ISP DNS failure with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');

// Placeholder constants to prevent seeding insecure default credentials
const PLACEHOLDER_PASSWORD = 'CHANGE_ME_use_a_strong_password';
const PLACEHOLDER_EMAIL = 'CHANGE_ME@example.com';
const PLACEHOLDER_NAME = 'CHANGE_ME';

// Guard function before establishing any database connection
if (!process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL === PLACEHOLDER_EMAIL) {
  console.error(
    'ERROR: ADMIN_EMAIL is missing or set to placeholder. Please configure a valid admin email in .env.'
  );
  process.exit(1);
}

if (
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD === PLACEHOLDER_PASSWORD
) {
  console.error(
    'ERROR: ADMIN_PASSWORD is missing or set to placeholder. Please configure a secure password in .env.'
  );
  process.exit(1);
}

if (!process.env.ADMIN_NAME || process.env.ADMIN_NAME === PLACEHOLDER_NAME) {
  console.error(
    'ERROR: ADMIN_NAME is missing or set to placeholder. Please configure an admin name in .env.'
  );
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in environment.');
  process.exit(1);
}

const sampleProducts = [
  // Electronics (4)
  {
    name: 'Wireless Bluetooth Headphones',
    description:
      'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
    price: 2999,
    category: 'Electronics',
    stock: 45,
    rating: 4.5,
    image:
      'https://placehold.co/400x300/1e40af/white?text=Headphones',
  },
  {
    name: 'Smart LED TV 43 inch',
    description:
      'Full HD Smart TV with built-in Wi-Fi, 3 HDMI ports, and streaming apps.',
    price: 28999,
    category: 'Electronics',
    stock: 12,
    rating: 4.3,
    image: 'https://placehold.co/400x300/1e40af/white?text=Smart+TV',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description:
      'RGB backlit mechanical keyboard with tactile switches and anti-ghosting.',
    price: 3499,
    category: 'Electronics',
    stock: 30,
    rating: 4.6,
    image: 'https://placehold.co/400x300/1e40af/white?text=Keyboard',
  },
  {
    name: 'Portable Power Bank 20000mAh',
    description:
      'Fast-charging power bank with dual USB ports and USB-C input.',
    price: 1299,
    category: 'Electronics',
    stock: 60,
    rating: 4.4,
    image: 'https://placehold.co/400x300/1e40af/white?text=Power+Bank',
  },

  // Fashion (3)
  {
    name: "Men's Slim Fit Chinos",
    description:
      'Comfortable slim-fit chinos available in multiple colours. Machine washable.',
    price: 899,
    category: 'Fashion',
    stock: 80,
    rating: 4.2,
    image: 'https://placehold.co/400x300/7c3aed/white?text=Chinos',
  },
  {
    name: "Women's Floral Kurta",
    description:
      'Lightweight cotton kurta with floral print, suitable for casual and festive wear.',
    price: 649,
    category: 'Fashion',
    stock: 55,
    rating: 4.4,
    image: 'https://placehold.co/400x300/7c3aed/white?text=Kurta',
  },
  {
    name: 'Leather Casual Sneakers',
    description:
      'Genuine leather sneakers with memory foam insole. Sizes 6–11.',
    price: 1799,
    category: 'Fashion',
    stock: 35,
    rating: 4.3,
    image: 'https://placehold.co/400x300/7c3aed/white?text=Sneakers',
  },

  // Home & Kitchen (3)
  {
    name: 'Stainless Steel Pressure Cooker 5L',
    description:
      '5-litre ISI-certified pressure cooker with induction-compatible base.',
    price: 1199,
    category: 'Home & Kitchen',
    stock: 40,
    rating: 4.5,
    image:
      'https://placehold.co/400x300/059669/white?text=Pressure+Cooker',
  },
  {
    name: 'Non-Stick Cookware Set (5 pcs)',
    description:
      'Granite-coated non-stick cookware set including frying pan, kadai, and tawa.',
    price: 2499,
    category: 'Home & Kitchen',
    stock: 25,
    rating: 4.3,
    image: 'https://placehold.co/400x300/059669/white?text=Cookware',
  },
  {
    name: 'Digital Air Fryer 4L',
    description:
      '4-litre digital air fryer with 8 preset modes and dishwasher-safe basket.',
    price: 4999,
    category: 'Home & Kitchen',
    stock: 18,
    rating: 4.6,
    image: 'https://placehold.co/400x300/059669/white?text=Air+Fryer',
  },

  // Sports (2)
  {
    name: 'Yoga Mat Anti-Slip 6mm',
    description:
      'Eco-friendly TPE yoga mat with carrying strap. 183cm x 61cm.',
    price: 599,
    category: 'Sports',
    stock: 70,
    rating: 4.4,
    image: 'https://placehold.co/400x300/d97706/white?text=Yoga+Mat',
  },
  {
    name: 'Adjustable Dumbbell Set 10kg',
    description:
      'Pair of adjustable chrome dumbbells with weight plates and carrying case.',
    price: 2199,
    category: 'Sports',
    stock: 22,
    rating: 4.5,
    image: 'https://placehold.co/400x300/d97706/white?text=Dumbbells',
  },

  // Books (3)
  {
    name: 'Clean Code by Robert C. Martin',
    description:
      'A handbook of agile software craftsmanship. Essential reading for every developer.',
    price: 549,
    category: 'Books',
    stock: 100,
    rating: 4.7,
    image: 'https://placehold.co/400x300/dc2626/white?text=Clean+Code',
  },
  {
    name: 'The Pragmatic Programmer',
    description:
      '20th anniversary edition — from journeyman to master. A classic for software engineers.',
    price: 699,
    category: 'Books',
    stock: 85,
    rating: 4.8,
    image: 'https://placehold.co/400x300/dc2626/white?text=Pragmatic',
  },
  {
    name: "You Don't Know JS (6-Book Set)",
    description:
      'Complete six-book series covering JavaScript deeply — scope, async, types, and more.',
    price: 1899,
    category: 'Books',
    stock: 50,
    rating: 4.9,
    image: 'https://placehold.co/400x300/dc2626/white?text=YDKJS',
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for database seeding.');

    // 1. Seed Admin Account (idempotent)
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('Admin account already exists. Skipping.');
      } else {
        console.warn(
          'WARNING: A user with this email exists but is not an admin. Not modifying.'
        );
      }
    } else {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
      );
      await User.create({
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin account created.');
    }

    // 2. Seed Products
    const forceFlag = process.argv.includes('--force');
    const existingCount = await Product.countDocuments({ isDeleted: false });

    if (existingCount > 0 && !forceFlag) {
      console.log(
        `${existingCount} products already exist. Use --force to reseed.`
      );
    } else {
      if (forceFlag) {
        console.warn(
          'WARNING: --force flag detected. Deleting all existing products...'
        );
        await Product.deleteMany({});
      }
      await Product.insertMany(sampleProducts);
      console.log(`${sampleProducts.length} products seeded.`);
    }

    await mongoose.disconnect();
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDatabase();
