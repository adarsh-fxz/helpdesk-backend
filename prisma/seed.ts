import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('Admin credentials not found in .env file');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: Role.ADMIN
            }
        });
        console.log('Admin user created successfully');
    } else {
        console.log('Admin user already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 