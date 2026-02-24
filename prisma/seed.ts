import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Administrator Kominfo",
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.username);

  // Create some sample assets
  const assets = [
    {
      code: "TIK-2024-001",
      name: "Server Utama Kominfo",
      category: "Server",
      brand: "Dell",
      model: "PowerEdge R740",
      serialNumber: "DELL-740-XYZ",
      status: "IN_USE",
      location: "Data Center Lt. 2",
      condition: "GOOD",
      price: 150000000
    },
    {
      code: "TIK-2024-002",
      name: "Laptop Kerja Kadis",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Pro M3",
      serialNumber: "APPLE-M3-001",
      status: "IN_USE",
      location: "Ruang Kepala Dinas",
      condition: "GOOD",
      price: 35000000
    },
    {
      code: "TIK-2024-003",
      name: "Router Core Backbone",
      category: "Router",
      brand: "Cisco",
      model: "ASR 1001-X",
      serialNumber: "CISCO-ASR-999",
      status: "AVAILABLE",
      location: "Gudang TIK",
      condition: "GOOD",
      price: 85000000
    }
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { code: asset.code },
      update: {},
      create: asset
    });
  }

  console.log("Sample assets created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
