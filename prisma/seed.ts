import { PrismaClient } from '@prisma/client'
import { seedDatabase } from '../lib/bootstrap'

const prisma = new PrismaClient()

seedDatabase(prisma, { log: true })
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
