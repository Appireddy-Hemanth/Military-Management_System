require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
console.log('Using DB:', connectionString);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean up existing data to be safe (optional but good for development)
  await prisma.auditLog.deleteMany();
  await prisma.expenditure.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.base.deleteMany();

  // Create Bases
  const baseAlpha = await prisma.base.create({ data: { name: 'Fort Alpha', location: 'Sector 1' } });
  const baseBravo = await prisma.base.create({ data: { name: 'Fort Bravo', location: 'Sector 2' } });
  const baseCharlie = await prisma.base.create({ data: { name: 'Fort Charlie', location: 'Sector 3' } });

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { username: 'Admin', passwordHash, role: 'ADMIN' }
  });

  const commanderAlpha = await prisma.user.create({
    data: { username: 'Base Commander Alpha', passwordHash, role: 'BASE_COMMANDER', baseId: baseAlpha.id }
  });

  const commanderBravo = await prisma.user.create({
    data: { username: 'Base Commander Bravo', passwordHash, role: 'BASE_COMMANDER', baseId: baseBravo.id }
  });

  const logOfficer = await prisma.user.create({
    data: { username: 'Logistics Officer', passwordHash, role: 'LOGISTICS_OFFICER', baseId: baseAlpha.id }
  });

  // Create Equipment Types
  const humvee = await prisma.equipmentType.create({ data: { name: 'Humvee', category: 'VEHICLE', description: 'High Mobility Multipurpose Wheeled Vehicle' } });
  const truck = await prisma.equipmentType.create({ data: { name: 'Military Truck', category: 'VEHICLE' } });
  const m4 = await prisma.equipmentType.create({ data: { name: 'M4 Carbine', category: 'WEAPON', description: '5.56×45mm NATO assault rifle' } });
  const pistol9mm = await prisma.equipmentType.create({ data: { name: '9mm Pistol', category: 'WEAPON' } });
  const ammo556 = await prisma.equipmentType.create({ data: { name: '5.56mm Ammunition', category: 'AMMUNITION', description: 'Standard rifle ammunition' } });
  const ammo9mm = await prisma.equipmentType.create({ data: { name: '9mm Ammunition', category: 'AMMUNITION' } });

  // Create Assets & Purchases
  // Seed basic initial individual assets
  await prisma.asset.create({ data: { baseId: baseAlpha.id, equipmentTypeId: humvee.id, serialNumber: 'HMV-1001', status: 'AVAILABLE', quantity: 1 } });
  await prisma.asset.create({ data: { baseId: baseAlpha.id, equipmentTypeId: humvee.id, serialNumber: 'HMV-1002', status: 'ASSIGNED', quantity: 1 } });
  await prisma.asset.create({ data: { baseId: baseBravo.id, equipmentTypeId: truck.id, serialNumber: 'TRK-2050', status: 'AVAILABLE', quantity: 1 } });

  // Pre-seed some purchases for movement tracking
  await prisma.purchase.create({
    data: { baseId: baseAlpha.id, equipmentTypeId: m4.id, quantity: 100, purchaseDate: new Date(), referenceNumber: 'PUR-001', createdById: admin.id }
  });
  await prisma.asset.create({
    data: { baseId: baseAlpha.id, equipmentTypeId: m4.id, quantity: 100, status: 'AVAILABLE' }
  });

  // Ammunition
  await prisma.purchase.create({
    data: { baseId: baseAlpha.id, equipmentTypeId: ammo556.id, quantity: 10000, purchaseDate: new Date(), referenceNumber: 'PUR-002', createdById: admin.id }
  });
  await prisma.asset.create({
    data: { baseId: baseAlpha.id, equipmentTypeId: ammo556.id, quantity: 10000, status: 'AVAILABLE' }
  });

  // Transfer Example
  await prisma.transfer.create({
    data: { sourceBaseId: baseAlpha.id, destinationBaseId: baseBravo.id, equipmentTypeId: m4.id, quantity: 20, status: 'COMPLETED', initiatedById: logOfficer.id }
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
