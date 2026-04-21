import { PrismaClient, Role, ChannelType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Onyx database...');

  // ─── Admin User ───────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { username: 'knull_onyx' },
    update: {},
    create: {
      username: 'knull_onyx',
      displayName: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user: @${admin.username}`);

  // ─── Community ────────────────────────────────────────────────────────────
  const community = await prisma.community.upsert({
    where: { id: 'community-onyx-main' },
    update: { name: process.env.COMMUNITY_NAME || 'Onyx' },
    create: {
      id: 'community-onyx-main',
      name: process.env.COMMUNITY_NAME || 'Onyx',
    },
  });
  console.log(`✅ Community: ${community.name}`);

  // ─── Default Channels ─────────────────────────────────────────────────────
  const channels: Array<{ name: string; type: ChannelType; position: number }> = [
    { name: 'general',       type: ChannelType.TEXT,  position: 0 },
    { name: 'announcements', type: ChannelType.TEXT,  position: 1 },
    { name: 'dev-talk',      type: ChannelType.TEXT,  position: 2 },
    { name: 'random',        type: ChannelType.TEXT,  position: 3 },
    { name: 'lounge',        type: ChannelType.VOICE, position: 4 },
    { name: 'gaming',        type: ChannelType.VOICE, position: 5 },
  ];

  for (const ch of channels) {
    await prisma.channel.upsert({
      where: {
        communityId_name: {
          communityId: community.id,
          name: ch.name,
        },
      },
      update: {},
      create: {
        ...ch,
        communityId: community.id,
      },
    });
    const icon = ch.type === ChannelType.TEXT ? '#' : '🔊';
    console.log(`✅ Channel: ${icon} ${ch.name}`);
  }

  console.log('\n🚀 Onyx is ready! Log in as @knull_onyx to start.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
