import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emptyConversations = await prisma.conversation.findMany({
    where: {
      messages: {
        none: {},
      },
    },
    select: { id: true },
  })

  console.log(`🔍 Found ${emptyConversations.length} empty conversations`)

  if (emptyConversations.length === 0) {
    console.log('✅ Nothing to clean up!')
    return
  }

  await prisma.conversationParticipant.deleteMany({
    where: {
      conversationId: { in: emptyConversations.map((c) => c.id) },
    },
  })

  await prisma.conversation.deleteMany({
    where: {
      id: { in: emptyConversations.map((c) => c.id) },
    },
  })

  console.log(`✅ Deleted ${emptyConversations.length} empty conversations`)
}

main().finally(() => prisma.$disconnect())