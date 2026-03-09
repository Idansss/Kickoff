import { PrismaClient } from '../lib/generated/prisma'

const MatchStatus = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
} as const

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

async function seedCore() {
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
}

async function seedFootballDomain() {
  console.log('Seeding football domain...')

  await prisma.matchLineup.deleteMany()
  await prisma.matchEvent.deleteMany()
  await prisma.match.deleteMany()
  await prisma.teamSquad.deleteMany()
  await prisma.transfer.deleteMany()
  ;(prisma as any).teamNewsItem?.deleteMany?.()
  ;(prisma as any).newsItem?.deleteMany?.()
  ;(prisma as any).standingRow?.deleteMany?.()
  await prisma.trophy.deleteMany()
  await prisma.season.deleteMany()
  await prisma.competition.deleteMany()
  await prisma.team.deleteMany()
  await prisma.player.deleteMany()

  const competition = await prisma.competition.create({
    data: {
      name: 'Premier League',
      country: 'England',
      type: 'league',
      logoUrl: 'https://crests.football-data.org/PL.png',
      seasons: {
        create: {
          yearStart: 2025,
          yearEnd: 2026,
        },
      },
    },
    include: { seasons: true },
  })

  // additional competitions for discovery and news
  await prisma.competition.createMany({
    data: [
      {
        name: 'La Liga',
        country: 'Spain',
        type: 'league',
        logoUrl: 'https://crests.football-data.org/PD.png',
      },
      {
        name: 'Serie A',
        country: 'Italy',
        type: 'league',
        logoUrl: 'https://crests.football-data.org/SA.png',
      },
      {
        name: 'Bundesliga',
        country: 'Germany',
        type: 'league',
        logoUrl: 'https://crests.football-data.org/BL1.png',
      },
      {
        name: 'Ligue 1',
        country: 'France',
        type: 'league',
        logoUrl: 'https://crests.football-data.org/FL1.png',
      },
      {
        name: 'UEFA Champions League',
        country: 'Europe',
        type: 'international',
        logoUrl: 'https://crests.football-data.org/CL.png',
      },
      {
        name: 'UEFA Europa League',
        country: 'Europe',
        type: 'international',
        logoUrl: 'https://crests.football-data.org/EL.png',
      },
      {
        name: 'FA Cup',
        country: 'England',
        type: 'cup',
        logoUrl: 'https://crests.football-data.org/FA.png',
      },
    ],
  })

  const season = competition.seasons[0]

  const teams = await prisma.$transaction([
    prisma.team.create({
      data: {
        name: 'Manchester City',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/65.png',
        venue: 'Etihad Stadium',
        coachName: 'Pep Guardiola',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Arsenal',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/57.png',
        venue: 'Emirates Stadium',
        coachName: 'Mikel Arteta',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Liverpool',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/64.png',
        venue: 'Anfield',
        coachName: 'Jürgen Klopp',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Chelsea',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/61.png',
        venue: 'Stamford Bridge',
        coachName: 'Mauricio Pochettino',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Tottenham Hotspur',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/73.png',
        venue: 'Tottenham Hotspur Stadium',
        coachName: 'Ange Postecoglou',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Manchester United',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/66.png',
        venue: 'Old Trafford',
        coachName: 'Erik ten Hag',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Newcastle United',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/67.png',
        venue: "St James' Park",
        coachName: 'Eddie Howe',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Aston Villa',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/58.png',
        venue: 'Villa Park',
        coachName: 'Unai Emery',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Brighton & Hove Albion',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/397.png',
        venue: 'Amex Stadium',
        coachName: 'Roberto De Zerbi',
      },
    }),
    prisma.team.create({
      data: {
        name: 'West Ham United',
        country: 'England',
        badgeUrl: 'https://crests.football-data.org/563.png',
        venue: 'London Stadium',
        coachName: 'David Moyes',
      },
    }),
  ])

  const [city, arsenal, liverpool, chelsea, spurs, united, newcastle, villa, brighton, westHam] = teams

  const players = await prisma.$transaction([
    prisma.player.create({
      data: {
        name: 'Erling Haaland',
        nationality: 'Norway',
        position: 'FW',
        preferredFoot: 'Left',
        currentTeamId: city.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Kevin De Bruyne',
        nationality: 'Belgium',
        position: 'MF',
        preferredFoot: 'Right',
        currentTeamId: city.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Phil Foden',
        nationality: 'England',
        position: 'MF',
        preferredFoot: 'Left',
        currentTeamId: city.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Bukayo Saka',
        nationality: 'England',
        position: 'FW',
        preferredFoot: 'Left',
        currentTeamId: arsenal.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Martin Ødegaard',
        nationality: 'Norway',
        position: 'MF',
        preferredFoot: 'Left',
        currentTeamId: arsenal.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Declan Rice',
        nationality: 'England',
        position: 'MF',
        preferredFoot: 'Right',
        currentTeamId: arsenal.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Mohamed Salah',
        nationality: 'Egypt',
        position: 'FW',
        preferredFoot: 'Left',
        currentTeamId: liverpool.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Virgil van Dijk',
        nationality: 'Netherlands',
        position: 'DF',
        preferredFoot: 'Right',
        currentTeamId: liverpool.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Alisson Becker',
        nationality: 'Brazil',
        position: 'GK',
        preferredFoot: 'Right',
        currentTeamId: liverpool.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Raheem Sterling',
        nationality: 'England',
        position: 'FW',
        preferredFoot: 'Right',
        currentTeamId: chelsea.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Christopher Nkunku',
        nationality: 'France',
        position: 'FW',
        preferredFoot: 'Right',
        currentTeamId: chelsea.id,
      },
    }),
    prisma.player.create({
      data: {
        name: 'Enzo Fernández',
        nationality: 'Argentina',
        position: 'MF',
        preferredFoot: 'Right',
        currentTeamId: chelsea.id,
      },
    }),
    // bench / depth players to reach 32+ total
    prisma.player.create({
      data: { name: 'Riyad Mahrez', nationality: 'Algeria', position: 'FW', currentTeamId: city.id },
    }),
    prisma.player.create({
      data: { name: 'Rodri', nationality: 'Spain', position: 'MF', currentTeamId: city.id },
    }),
    prisma.player.create({
      data: { name: 'Gabriel Jesus', nationality: 'Brazil', position: 'FW', currentTeamId: arsenal.id },
    }),
    prisma.player.create({
      data: { name: 'Gabriel Magalhães', nationality: 'Brazil', position: 'DF', currentTeamId: arsenal.id },
    }),
    prisma.player.create({
      data: { name: 'Trent Alexander-Arnold', nationality: 'England', position: 'DF', currentTeamId: liverpool.id },
    }),
    prisma.player.create({
      data: { name: 'Andrew Robertson', nationality: 'Scotland', position: 'DF', currentTeamId: liverpool.id },
    }),
    prisma.player.create({
      data: { name: 'Reece James', nationality: 'England', position: 'DF', currentTeamId: chelsea.id },
    }),
    prisma.player.create({
      data: { name: 'Thiago Silva', nationality: 'Brazil', position: 'DF', currentTeamId: chelsea.id },
    }),
    // extra players to deepen agent/contract coverage
    prisma.player.create({
      data: { name: 'Julian Alvarez', nationality: 'Argentina', position: 'FW', currentTeamId: city.id },
    }),
    prisma.player.create({
      data: { name: 'Manuel Akanji', nationality: 'Switzerland', position: 'DF', currentTeamId: city.id },
    }),
    prisma.player.create({
      data: { name: 'Jurrien Timber', nationality: 'Netherlands', position: 'DF', currentTeamId: arsenal.id },
    }),
    prisma.player.create({
      data: { name: 'Leandro Trossard', nationality: 'Belgium', position: 'FW', currentTeamId: arsenal.id },
    }),
    prisma.player.create({
      data: { name: 'Dominik Szoboszlai', nationality: 'Hungary', position: 'MF', currentTeamId: liverpool.id },
    }),
    prisma.player.create({
      data: { name: 'Diogo Jota', nationality: 'Portugal', position: 'FW', currentTeamId: liverpool.id },
    }),
    prisma.player.create({
      data: { name: 'Cole Palmer', nationality: 'England', position: 'FW', currentTeamId: chelsea.id },
    }),
    prisma.player.create({
      data: { name: 'Malo Gusto', nationality: 'France', position: 'DF', currentTeamId: chelsea.id },
    }),
  ])

  console.log(`Created competition, season, ${teams.length} teams, ${players.length} players`)

  const now = new Date()
  const day1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0)
  const day2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 30, 0)
  const day3 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 20, 0, 0)

  const matches = await prisma.$transaction([
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: day1,
        status: MatchStatus.FINISHED,
        homeTeamId: city.id,
        awayTeamId: arsenal.id,
        homeScore: 2,
        awayScore: 1,
        venue: city.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day1.getTime() + 2 * 60 * 60 * 1000),
        status: MatchStatus.FINISHED,
        homeTeamId: liverpool.id,
        awayTeamId: chelsea.id,
        homeScore: 3,
        awayScore: 2,
        venue: liverpool.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day1.getTime() + 4 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: arsenal.id,
        awayTeamId: chelsea.id,
        venue: arsenal.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: day2,
        status: MatchStatus.SCHEDULED,
        homeTeamId: chelsea.id,
        awayTeamId: city.id,
        venue: chelsea.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day2.getTime() + 2 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: arsenal.id,
        awayTeamId: liverpool.id,
        venue: arsenal.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day2.getTime() + 4 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: city.id,
        awayTeamId: liverpool.id,
        venue: city.venue,
      },
    }),
    // additional fixtures across 3 matchdays
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: day3,
        status: MatchStatus.SCHEDULED,
        homeTeamId: spurs.id,
        awayTeamId: united.id,
        venue: spurs.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day3.getTime() + 2 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: newcastle.id,
        awayTeamId: villa.id,
        venue: newcastle.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day3.getTime() + 4 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: brighton.id,
        awayTeamId: westHam.id,
        venue: brighton.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day1.getTime() + 6 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: spurs.id,
        awayTeamId: brighton.id,
        venue: spurs.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day2.getTime() + 6 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: united.id,
        awayTeamId: westHam.id,
        venue: united.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day3.getTime() + 6 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: newcastle.id,
        awayTeamId: chelsea.id,
        venue: newcastle.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day1.getTime() + 8 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: villa.id,
        awayTeamId: city.id,
        venue: villa.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day2.getTime() + 8 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: liverpool.id,
        awayTeamId: spurs.id,
        venue: liverpool.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day3.getTime() + 8 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: arsenal.id,
        awayTeamId: united.id,
        venue: arsenal.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day1.getTime() + 10 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: westHam.id,
        awayTeamId: newcastle.id,
        venue: westHam.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day2.getTime() + 10 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: brighton.id,
        awayTeamId: villa.id,
        venue: brighton.venue,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: competition.id,
        seasonId: season.id,
        kickoff: new Date(day3.getTime() + 10 * 60 * 60 * 1000),
        status: MatchStatus.SCHEDULED,
        homeTeamId: chelsea.id,
        awayTeamId: arsenal.id,
        venue: chelsea.venue,
      },
    }),
  ])

  console.log(`Created ${matches.length} matches`)

  // simple Premier League standings snapshot for 10 teams
  ;(prisma as any).standingRow?.createMany?.({
    data: [
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: city.id,
        position: 1,
        played: 10,
        won: 8,
        drawn: 1,
        lost: 1,
        goalsFor: 25,
        goalsAgainst: 8,
        goalDiff: 17,
        points: 25,
        form: 'WWDWW',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: arsenal.id,
        position: 2,
        played: 10,
        won: 7,
        drawn: 2,
        lost: 1,
        goalsFor: 21,
        goalsAgainst: 9,
        goalDiff: 12,
        points: 23,
        form: 'WDWWW',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: liverpool.id,
        position: 3,
        played: 10,
        won: 7,
        drawn: 1,
        lost: 2,
        goalsFor: 22,
        goalsAgainst: 11,
        goalDiff: 11,
        points: 22,
        form: 'LWWWL',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: spurs.id,
        position: 4,
        played: 10,
        won: 6,
        drawn: 2,
        lost: 2,
        goalsFor: 19,
        goalsAgainst: 12,
        goalDiff: 7,
        points: 20,
        form: 'DWLLW',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: villa.id,
        position: 5,
        played: 10,
        won: 6,
        drawn: 1,
        lost: 3,
        goalsFor: 20,
        goalsAgainst: 14,
        goalDiff: 6,
        points: 19,
        form: 'WLWLW',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: newcastle.id,
        position: 6,
        played: 10,
        won: 5,
        drawn: 2,
        lost: 3,
        goalsFor: 18,
        goalsAgainst: 13,
        goalDiff: 5,
        points: 17,
        form: 'DLWWD',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: united.id,
        position: 7,
        played: 10,
        won: 5,
        drawn: 1,
        lost: 4,
        goalsFor: 15,
        goalsAgainst: 14,
        goalDiff: 1,
        points: 16,
        form: 'WLWLL',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: brighton.id,
        position: 8,
        played: 10,
        won: 4,
        drawn: 3,
        lost: 3,
        goalsFor: 17,
        goalsAgainst: 16,
        goalDiff: 1,
        points: 15,
        form: 'DDWLW',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: chelsea.id,
        position: 9,
        played: 10,
        won: 3,
        drawn: 3,
        lost: 4,
        goalsFor: 13,
        goalsAgainst: 15,
        goalDiff: -2,
        points: 12,
        form: 'DLDDL',
      },
      {
        competitionId: competition.id,
        seasonId: season.id,
        teamId: westHam.id,
        position: 10,
        played: 10,
        won: 3,
        drawn: 2,
        lost: 5,
        goalsFor: 12,
        goalsAgainst: 18,
        goalDiff: -6,
        points: 11,
        form: 'LLWDD',
      },
    ],
  })

  // simple squads for all teams in current season
  const makeSquad = async (teamId: string) => {
    const teamPlayers = players.filter((p) => p.currentTeamId === teamId)
    for (const [index, p] of teamPlayers.entries()) {
      await prisma.teamSquad.create({
        data: {
          teamId,
          seasonId: season.id,
          playerId: p.id,
          role: p.position ?? undefined,
          shirtNo: 1 + index,
        },
      })
    }
  }

  await makeSquad(city.id)
  await makeSquad(arsenal.id)
  await makeSquad(liverpool.id)
  await makeSquad(chelsea.id)

  // agents & agencies
  const agencies = await prisma.$transaction([
    prisma.agency.create({
      data: {
        name: 'Elite Football Agency',
        country: 'England',
        website: 'https://elite-agency.example.com',
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Global Sports Group',
        country: 'Germany',
        website: 'https://globalsports.example.com',
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Premier Talent Management',
        country: 'Spain',
        website: 'https://premier-talent.example.com',
      },
    }),
  ])

  const agents = await prisma.$transaction([
    prisma.agent.create({ data: { name: 'Mino Rossi', country: 'Italy', email: 'mino.rossi@example.com' } }),
    prisma.agent.create({ data: { name: 'Sarah Klein', country: 'Germany', email: 'sarah.klein@example.com' } }),
    prisma.agent.create({ data: { name: 'Luis Romero', country: 'Spain', email: 'luis.romero@example.com' } }),
    prisma.agent.create({ data: { name: 'Alex Martins', country: 'Portugal', email: 'alex.martins@example.com' } }),
    prisma.agent.create({ data: { name: 'Emma Hughes', country: 'England', email: 'emma.hughes@example.com' } }),
    prisma.agent.create({ data: { name: 'Jonas Meyer', country: 'Switzerland', email: 'jonas.meyer@example.com' } }),
    prisma.agent.create({ data: { name: 'Pierre Dubois', country: 'France', email: 'pierre.dubois@example.com' } }),
    prisma.agent.create({ data: { name: 'Jamal Carter', country: 'USA', email: 'jamal.carter@example.com' } }),
    prisma.agent.create({ data: { name: 'Helena Costa', country: 'Brazil', email: 'helena.costa@example.com' } }),
    prisma.agent.create({ data: { name: 'Nadia Petrov', country: 'Russia', email: 'nadia.petrov@example.com' } }),
  ])

  // map agents to agencies
  await prisma.$transaction([
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[0].id, agencyId: agencies[0].id, role: 'Founder' },
    }),
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[1].id, agencyId: agencies[0].id, role: 'Senior Agent' },
    }),
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[2].id, agencyId: agencies[1].id, role: 'Lead Agent' },
    }),
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[3].id, agencyId: agencies[1].id, role: 'Agent' },
    }),
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[4].id, agencyId: agencies[2].id, role: 'Managing Partner' },
    }),
    prisma.agentAgencyMembership.create({
      data: { agentId: agents[5].id, agencyId: agencies[2].id, role: 'Analyst' },
    }),
  ])

  // assign current agents/agencies to players
  const playerAgentLinks = [
    { playerIndex: 0, agentIndex: 0, agencyIndex: 0 },
    { playerIndex: 1, agentIndex: 1, agencyIndex: 0 },
    { playerIndex: 2, agentIndex: 2, agencyIndex: 1 },
    { playerIndex: 3, agentIndex: 3, agencyIndex: 1 },
    { playerIndex: 4, agentIndex: 4, agencyIndex: 2 },
    { playerIndex: 5, agentIndex: 5, agencyIndex: 2 },
    { playerIndex: 6, agentIndex: 6, agencyIndex: 0 },
    { playerIndex: 7, agentIndex: 7, agencyIndex: 1 },
    { playerIndex: 8, agentIndex: 8, agencyIndex: 2 },
    { playerIndex: 9, agentIndex: 9, agencyIndex: 0 },
    { playerIndex: 10, agentIndex: 0, agencyIndex: 0 },
    { playerIndex: 11, agentIndex: 1, agencyIndex: 0 },
    { playerIndex: 12, agentIndex: 2, agencyIndex: 1 },
    { playerIndex: 13, agentIndex: 3, agencyIndex: 1 },
    { playerIndex: 14, agentIndex: 4, agencyIndex: 2 },
    { playerIndex: 15, agentIndex: 5, agencyIndex: 2 },
    { playerIndex: 16, agentIndex: 6, agencyIndex: 0 },
    { playerIndex: 17, agentIndex: 7, agencyIndex: 1 },
    { playerIndex: 18, agentIndex: 8, agencyIndex: 2 },
    { playerIndex: 19, agentIndex: 9, agencyIndex: 0 },
  ]

  await prisma.$transaction(
    playerAgentLinks.map((link) =>
      prisma.playerAgent.create({
        data: {
          playerId: players[link.playerIndex].id,
          agentId: agents[link.agentIndex].id,
          agencyId: agencies[link.agencyIndex].id,
          startDate: new Date(now.getFullYear() - 1, 6, 1),
        },
      }),
    ),
  )

  // transfers
  await prisma.transfer.create({
    data: {
      playerId: players[0].id,
      fromTeamId: chelsea.id,
      toTeamId: city.id,
      type: 'permanent',
      fee: '€90m',
      date: new Date(now.getFullYear() - 1, 6, 1),
    },
  })

  await prisma.transfer.create({
    data: {
      playerId: players[3].id,
      fromTeamId: city.id,
      toTeamId: arsenal.id,
      type: 'loan',
      fee: 'Loan',
      date: new Date(now.getFullYear() - 1, 0, 15),
    },
  })

  // player contracts (mix of active, expiring soon and free agents)
  const contractStart = new Date(now.getFullYear() - 1, 6, 1)
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
  const twelveMonthsFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const expiredLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  await prisma.playerContract.createMany({
    data: [
      {
        playerId: players[0].id,
        clubId: city.id,
        startDate: contractStart,
        endDate: twelveMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 200_000,
        releaseClauseEur: 180_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[1].id,
        clubId: city.id,
        startDate: contractStart,
        endDate: threeMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 250_000,
        releaseClauseEur: 100_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[3].id,
        clubId: arsenal.id,
        startDate: contractStart,
        endDate: twelveMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 150_000,
        releaseClauseEur: 120_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[5].id,
        clubId: arsenal.id,
        startDate: contractStart,
        endDate: threeMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 180_000,
        releaseClauseEur: 95_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[6].id,
        clubId: liverpool.id,
        startDate: contractStart,
        endDate: twelveMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 220_000,
        releaseClauseEur: 130_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[9].id,
        clubId: chelsea.id,
        startDate: contractStart,
        endDate: twelveMonthsFromNow,
        isOnLoan: false,
        status: 'ACTIVE',
        wageEur: 190_000,
        releaseClauseEur: 110_000_000,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      // free agents (contract expired, no current club)
      {
        playerId: players[20].id,
        clubId: null,
        startDate: new Date(now.getFullYear() - 4, 7, 1),
        endDate: expiredLastMonth,
        isOnLoan: false,
        status: 'EXPIRED',
        wageEur: 80_000,
        releaseClauseEur: null,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
      {
        playerId: players[21].id,
        clubId: null,
        startDate: new Date(now.getFullYear() - 3, 7, 1),
        endDate: expiredLastMonth,
        isOnLoan: false,
        status: 'EXPIRED',
        wageEur: 70_000,
        releaseClauseEur: null,
        extensionOptionDate: null,
        loanFromTeamId: null,
        agentId: null,
      },
    ],
  })

  // market value snapshots for players and clubs
  const valueBaseDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const valueWindows = [0, 30, 60, 90, 120, 150]

  // 20 players across 6 dates
  for (let i = 0; i < Math.min(players.length, 20); i++) {
    const player = players[i]
    for (let idx = 0; idx < valueWindows.length; idx++) {
      const date = new Date(valueBaseDate.getTime() + valueWindows[idx] * 24 * 60 * 60 * 1000)
      const baseValue = 40_000_000 + i * 2_000_000
      const fluctuation = (idx - 2) * 2_500_000
      const valueEur = Math.max(5_000_000, baseValue + fluctuation)
      await prisma.marketValueSnapshot.create({
        data: {
          playerId: player.id,
          teamId: player.currentTeamId ?? null,
          date,
          valueEur,
          currency: 'EUR',
          source: 'SeedData',
          note: 'Synthetic seed value',
        },
      })
    }
  }

  // simple club-level snapshots
  const clubsForValues = [city, arsenal, liverpool, chelsea]
  for (const club of clubsForValues) {
    for (let idx = 0; idx < valueWindows.length; idx++) {
      const date = new Date(valueBaseDate.getTime() + valueWindows[idx] * 24 * 60 * 60 * 1000)
      const baseValue = 600_000_000
      const fluctuation = (idx - 2) * 25_000_000
      await prisma.marketValueSnapshot.create({
        data: {
          playerId: null,
          teamId: club.id,
          date,
          valueEur: baseValue + fluctuation,
          currency: 'EUR',
          source: 'SeedData',
          note: 'Squad valuation snapshot',
        },
      })
    }
  }

  // trophies
  await prisma.trophy.createMany({
    data: [
      {
        teamId: city.id,
        competitionId: competition.id,
        seasonLabel: '2024/25',
        count: 1,
      },
      {
        teamId: liverpool.id,
        competitionId: competition.id,
        seasonLabel: '2019/20',
        count: 1,
      },
    ],
  })

  // simple team news items
  ;(prisma as any).teamNewsItem?.createMany?.({
    data: [
      {
        teamId: city.id,
        title: 'City prepare for title charge',
        source: 'Kickoff News',
        url: 'https://example.com/city-title-charge',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        teamId: city.id,
        title: 'Haaland back in full training',
        source: 'Kickoff News',
        url: 'https://example.com/haaland-training',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        teamId: arsenal.id,
        title: 'Arsenal focus on defensive solidity',
        source: 'Kickoff News',
        url: 'https://example.com/arsenal-defense',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        teamId: liverpool.id,
        title: 'Anfield under the lights: big clash ahead',
        source: 'Kickoff News',
        url: 'https://example.com/anfield-big-clash',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        teamId: chelsea.id,
        title: 'Chelsea academy prospects impress in training',
        source: 'Kickoff News',
        url: 'https://example.com/chelsea-academy',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
      },
    ],
  })

  // global news items across scopes
  ;(prisma as any).newsItem?.createMany?.({
    data: [
      {
        scope: 'LATEST',
        title: 'Title race heats up in the Premier League',
        summary:
          'City, Arsenal and Liverpool are separated by just three points after a thrilling weekend.',
        source: 'Kickoff Newsroom',
        url: 'https://example.com/pl-title-race',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'LATEST',
        title: 'Haaland scores decisive brace in top-of-table clash',
        summary: 'The Norwegian striker once again delivered when it mattered most.',
        source: 'Kickoff Newsroom',
        url: 'https://example.com/haaland-brace',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: city.id,
        playerId: players[0].id,
      },
      {
        scope: 'LATEST',
        title: 'Saka shines as Arsenal keep pressure on leaders',
        summary: 'Another influential display from the England winger keeps Arsenal in the hunt.',
        source: 'Kickoff Newsroom',
        url: 'https://example.com/saka-shines',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: arsenal.id,
        playerId: players[3].id,
      },
      {
        scope: 'LATEST',
        title: 'Villa Park rocking as Emery’s side continue strong home form',
        summary: null,
        source: 'Kickoff Newsroom',
        url: 'https://example.com/villa-park-form',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: villa.id,
        playerId: null,
      },
      {
        scope: 'LATEST',
        title: 'Brighton youngsters impress again in high-tempo draw',
        summary: null,
        source: 'Kickoff Newsroom',
        url: 'https://example.com/brighton-youngsters',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: brighton.id,
        playerId: null,
      },
      {
        scope: 'TRANSFERS',
        title: 'European giants lining up summer move for Declan Rice',
        summary: 'Midfielder continues to attract interest after another dominant season.',
        source: 'Transfer Zone',
        url: 'https://example.com/rice-links',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: arsenal.id,
        playerId: players[5].id,
      },
      {
        scope: 'TRANSFERS',
        title: 'Liverpool preparing contract extension offer for Salah',
        summary: null,
        source: 'Transfer Zone',
        url: 'https://example.com/salah-extension',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: liverpool.id,
        playerId: players[6].id,
      },
      {
        scope: 'TRANSFERS',
        title: 'Manchester United monitoring emerging Brighton full-back',
        summary: null,
        source: 'Transfer Zone',
        url: 'https://example.com/united-brighton-fullback',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: brighton.id,
        playerId: null,
      },
      {
        scope: 'TRANSFERS',
        title: 'Chelsea open to loan exits for several academy graduates',
        summary: null,
        source: 'Transfer Zone',
        url: 'https://example.com/chelsea-loans',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
        competitionId: competition.id,
        teamId: chelsea.id,
        playerId: null,
      },
      {
        scope: 'LEAGUE',
        title: 'La Liga title battle shaping up as Madrid and Barcelona trade blows',
        summary: null,
        source: 'Kickoff World',
        url: 'https://example.com/laliga-title-battle',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'LEAGUE',
        title: 'Serie A tactical trends: high pressing and aggressive wing play',
        summary: null,
        source: 'Kickoff World',
        url: 'https://example.com/seriea-tactics',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'LEAGUE',
        title: 'Bundesliga continues to produce elite attacking talent',
        summary: null,
        source: 'Kickoff World',
        url: 'https://example.com/bundesliga-talent',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'LEAGUE',
        title: 'Ligue 1 clubs focus on youth development as budgets tighten',
        summary: null,
        source: 'Kickoff World',
        url: 'https://example.com/ligue1-youth',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 13 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'LATEST',
        title: 'Champions League draw throws up heavyweight clashes',
        summary: null,
        source: 'Kickoff Europe',
        url: 'https://example.com/ucl-draw',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
      {
        scope: 'TRANSFERS',
        title: 'Agents expect busy summer window across Europe',
        summary: null,
        source: 'Transfer Zone',
        url: 'https://example.com/europe-summer-window',
        imageUrl: null,
        publishedAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
        competitionId: null,
        teamId: null,
        playerId: null,
      },
    ],
  })

  // forum categories, threads and posts
  const forumGeneral = await prisma.forumCategory.create({
    data: { slug: 'general', name: 'General Discussion', description: 'Talk about anything football.' },
  })
  const forumTransfers = await prisma.forumCategory.create({
    data: { slug: 'transfers', name: 'Transfers', description: 'Transfer news and analysis.' },
  })
  const forumRumours = await prisma.forumCategory.create({
    data: { slug: 'rumours', name: 'Rumours', description: 'Transfer rumours and speculation.' },
  })
  const forumTactics = await prisma.forumCategory.create({
    data: { slug: 'tactics', name: 'Tactics', description: 'Shape, systems and strategy.' },
  })
  const forumYouth = await prisma.forumCategory.create({
    data: { slug: 'youth', name: 'Youth & Prospects', description: 'Young talent watch.' },
  })

  const users = await prisma.user.findMany({ take: 4, orderBy: { createdAt: 'asc' } })
  const userId = users[0]?.id ?? 'u1'

  const premierLeagueThread = await prisma.forumThread.create({
    data: {
      categoryId: forumGeneral.id,
      title: 'Premier League title race',
      authorId: userId,
    },
  })

  const haalandRumourThread = await prisma.forumThread.create({
    data: {
      categoryId: forumRumours.id,
      title: 'Haaland to Real Madrid?',
      authorId: userId,
      isRumour: true,
      relatedClubId: city.id,
      relatedPlayerId: players[0].id,
    },
  })

  const arsenalTacticsThread = await prisma.forumThread.create({
    data: {
      categoryId: forumTactics.id,
      title: 'How should Arsenal set up vs City?',
      authorId: userId,
      relatedClubId: arsenal.id,
    },
  })

  await prisma.forumPost.createMany({
    data: [
      {
        threadId: premierLeagueThread.id,
        authorId: userId,
        content: 'Who do you think will win the title this season?',
      },
      {
        threadId: premierLeagueThread.id,
        authorId: users[1]?.id ?? userId,
        content: 'City are favourites but Arsenal and Liverpool are very close.',
      },
      {
        threadId: haalandRumourThread.id,
        authorId: users[2]?.id ?? userId,
        content: 'Can Real even afford him under the current FFP rules?',
      },
      {
        threadId: arsenalTacticsThread.id,
        authorId: users[3]?.id ?? userId,
        content: 'I would go with a 4-3-3 and Rice shielding the back four.',
      },
    ],
  })

  // simple subscriptions for unread/watchlist behaviour
  await prisma.forumThreadSubscription.createMany({
    data: [
      { threadId: premierLeagueThread.id, userId },
      { threadId: haalandRumourThread.id, userId },
    ],
  })

  // tags
  const tagTransfers = await prisma.forumTag.create({ data: { name: 'Transfers', slug: 'transfers' } })
  const tagRumours = await prisma.forumTag.create({ data: { name: 'Rumours', slug: 'rumours' } })

  await prisma.forumTagOnThread.createMany({
    data: [
      { threadId: premierLeagueThread.id, tagId: tagTransfers.id },
      { threadId: haalandRumourThread.id, tagId: tagRumours.id },
    ],
  })

  // sample value quiz attempts
  await prisma.valueQuizAttempt.createMany({
    data: [
      {
        userId,
        playerId: players[0].id,
        guessedValueEur: 170_000_000,
        actualValueEur: 180_000_000,
        deltaEur: -10_000_000,
      },
      {
        userId,
        playerId: players[3].id,
        guessedValueEur: 120_000_000,
        actualValueEur: 110_000_000,
        deltaEur: 10_000_000,
      },
    ],
  })

  console.log('Football domain seeding complete!')
}

async function main() {
  await seedCore()
  await seedFootballDomain()
  console.log('Seeding complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
