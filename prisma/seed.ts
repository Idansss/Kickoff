import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

const USERS = [
  {
    id: 'u1',
    name: 'Alex Turner',
    handle: 'alexturner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Football enthusiast | Manchester supporter',
    followers: 2850,
    following: 456,
  },
  {
    id: 'u2',
    name: 'Jordan Silva',
    handle: 'jordansilva',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    bio: 'Fan of beautiful football',
    followers: 1240,
    following: 892,
  },
  {
    id: 'u3',
    name: 'Sam Johnson',
    handle: 'samjohnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    bio: 'Tactical analysis | Strategy nerd',
    followers: 3120,
    following: 234,
  },
  {
    id: 'u4',
    name: 'Riley Chen',
    handle: 'rileychen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
    bio: 'Live match coverage specialist',
    followers: 5670,
    following: 123,
  },
]

const POSTS = [
  {
    id: 'post1',
    authorId: 'u1',
    content: 'Incredible performance from Haaland today! The composure in front of goal is just different.',
    likes: [],
    shares: 23,
    relatedPlayerId: 'p1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'post2',
    authorId: 'u2',
    content: 'That defensive display from Arsenal was textbook. Rice and the back line were immense.',
    likes: [{ userId: 'u1' }],
    shares: 67,
    relatedMatchId: 'm2',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'post3',
    authorId: 'u3',
    content: 'Looking at the tactical adjustments in the second half... fascinating stuff. The 4-2-3-1 switch completely changed the game\'s dynamics.',
    likes: [],
    shares: 12,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 'post4',
    authorId: 'u4',
    content: 'City vs Liverpool this weekend - this is the match we\'ve all been waiting for! Both squads are at full strength. Gonna be electric.',
    likes: [],
    shares: 89,
    relatedMatchId: 'm1',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'post5',
    authorId: 'u1',
    content: 'Salah\'s footwork in that sequence was just poetry in motion. One of the best wingers to ever play the game.',
    likes: [],
    shares: 23,
    relatedPlayerId: 'p2',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: 'post6',
    authorId: 'u3',
    content: 'Saka is genuinely world class. 14 goals and 11 assists this season at 23 years old. His ceiling is frightening.',
    likes: [],
    shares: 34,
    relatedPlayerId: 'p3',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
]

const MESSAGES = [
  { roomId: 'm4', authorId: 'u2', content: 'Arsenal absolutely bossing this first half!', createdAt: new Date(Date.now() - 60 * 60000) },
  { roomId: 'm4', authorId: 'u3', content: 'That Saka goal was inevitable, he\'s been on fire', createdAt: new Date(Date.now() - 55 * 60000) },
  { roomId: 'm4', authorId: 'u4', content: 'Liverpool need to press higher or this is over', createdAt: new Date(Date.now() - 48 * 60000) },
  { roomId: 'm4', authorId: 'u2', content: 'Salah\'s been quiet, not like him', createdAt: new Date(Date.now() - 40 * 60000) },
  { roomId: 'm4', authorId: 'u3', content: 'Rice is everywhere in midfield, controlling the tempo', createdAt: new Date(Date.now() - 30 * 60000) },
  { roomId: 'm4', authorId: 'u4', content: 'GOAAAL! 2-1! What a comeback this would be!', createdAt: new Date(Date.now() - 15 * 60000) },
  { roomId: 'm4', authorId: 'u2', content: 'Still 12 minutes to go, this is nerve-wracking!', createdAt: new Date(Date.now() - 8 * 60000) },
  { roomId: 'm1', authorId: 'u3', content: 'Anyone else counting down the days for City vs Liverpool?', createdAt: new Date(Date.now() - 3 * 60 * 60000) },
  { roomId: 'm1', authorId: 'u4', content: 'This is going to be a six-pointer for sure', createdAt: new Date(Date.now() - 2.5 * 60 * 60000) },
  { roomId: 'general', authorId: 'u1', content: 'What\'s everyone\'s prediction for El Clasico?', createdAt: new Date(Date.now() - 5 * 60 * 60000) },
  { roomId: 'general', authorId: 'u2', content: 'Real Madrid every time. Vini is unplayable in big games', createdAt: new Date(Date.now() - 4.5 * 60 * 60000) },
]

async function main() {
  console.log('Seeding database...')

  await prisma.userRepost.deleteMany()
  await prisma.like.deleteMany()
  await prisma.message.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  for (const user of USERS) {
    await prisma.user.create({ data: user })
  }
  console.log(`Created ${USERS.length} users`)

  for (const { likes, ...post } of POSTS) {
    const created = await prisma.post.create({ data: post })
    for (const like of likes) {
      await prisma.like.create({ data: { postId: created.id, userId: like.userId } })
    }
  }
  console.log(`Created ${POSTS.length} posts`)

  for (const message of MESSAGES) {
    await prisma.message.create({ data: message })
  }
  console.log(`Created ${MESSAGES.length} messages`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
