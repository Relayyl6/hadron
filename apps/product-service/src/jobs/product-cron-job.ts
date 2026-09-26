import { prisma } from '@hadron/lib/prisma';
import cron from 'node-cron'

cron.schedule("0 * * * *", async () => {
    try {
        const now = new Date();
        const deletedProducts = await prisma.products.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: { lte: now }
            }
        })
        console.log(`🗑️${deletedProducts.count} expired products permanently deleted`)
    } catch (error) {
        console.error(error)
    }
})