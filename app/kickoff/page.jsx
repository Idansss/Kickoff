'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── STYLES ──────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Bebas+Neue&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#0e0e0e;}
    ::-webkit-scrollbar{width:0;height:0;}
    .pulse{animation:pulse 1.8s ease-in-out infinite;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.25;}}
    .bounce-like{animation:bounceLike 0.35s;}
    @keyframes bounceLike{0%,100%{transform:scale(1);}40%{transform:scale(1.45);}70%{transform:scale(0.9);}}
    .tab-in{animation:tabIn 0.18s ease;}
    @keyframes tabIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
    .slide-down{animation:slideDown 0.22s ease;}
    @keyframes slideDown{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}
    .msg-in{animation:msgIn 0.18s ease;}
    @keyframes msgIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    .shimmer{background:linear-gradient(90deg,#161616 25%,#222 50%,#161616 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
    @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
    .badge-pop{animation:badgePop 0.4s;}
    @keyframes badgePop{0%{transform:scale(0.5);}70%{transform:scale(1.2);}100%{transform:scale(1);}}
    textarea{resize:none;outline:none;}
    input{outline:none;}
    button{cursor:pointer;border:none;background:none;}
    select{cursor:pointer;}
    .no-select{user-select:none;}
  `}</style>
)

/* ─── MOCK DATA ───────────────────────────────────────────── */
const COLORS = ['#e11d48','#7c3aed','#0ea5e9','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6']
const userColor = name => COLORS[name.charCodeAt(0) % COLORS.length]
const initials = name => name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
const timeAgo = mins => mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`
const decodeEntity = entity => {
  const codePoint = Number(entity.replace('&#', '').replace(';', ''))
  return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity
}

const CURRENT_USER = { id:'u0', name:'You', handle:'you', avatar:'YO', color:'#1DB954' }

const POSTS = [
  { id:'p1', user:{name:'Sky Sports News',handle:'SkySportsNews',verified:true,color:'#0ea5e9',avatar:'SS'}, time:3, tag:'PL', text:'🚨 BREAKING: Erling Haaland scores his 30th Premier League goal of the season to make it 2-0 against Arsenal. Unstoppable. #MCIARS #Haaland #PL', likes:2847, comments:312, reposts:891, bookmarked:false, liked:false },
  { id:'p2', user:{name:'Fabrizio Romano',handle:'FabrizioRomano',verified:true,color:'#7c3aed',avatar:'FR'}, time:12, tag:'Transfer', text:'Kylian Mbappé to join Al-Hilal on a 3-year deal — DONE DEAL ✅ He will earn €200M per year. Medical scheduled for Monday. Here we go! 🤝 #Mbappe #AlHilal #Transfer', likes:51203, comments:8941, reposts:22100, bookmarked:false, liked:false },
  { id:'p3', user:{name:'StatsBomb',handle:'StatsBomb',verified:true,color:'#f59e0b',avatar:'SB'}, time:28, tag:'Stats', text:'Rodri\'s pass completion rate this season: 94.3%. He has completed more passes than any midfielder in Europe\'s top 5 leagues. The engine room. 📊 #Rodri #ManCity #Stats', likes:3421, comments:287, reposts:1204, bookmarked:false, liked:false, poll:{question:'Best CM in the world right now?', options:[{text:'Rodri',votes:4821},{text:'Bellingham',votes:2103},{text:'Kroos',votes:1876},{text:'De Bruyne',votes:3201}], voted:null} },
  { id:'p4', user:{name:'Arsenal Fan TV',handle:'ArsenalFanTV',verified:false,color:'#e11d48',avatar:'AF'}, time:45, tag:'PL', text:'We were ROBBED tonight. That penalty decision was an absolute joke. How is that not a red card?! VAR is killing football. @PGMOL needs to explain themselves. #ARSMCI #Arsenal', likes:891, comments:445, reposts:123, bookmarked:false, liked:false },
  { id:'p5', user:{name:'UCL Official',handle:'ChampionsLeague',verified:true,color:'#1DB954',avatar:'CL'}, time:62, tag:'UCL', text:'🏆 QUARTER-FINAL DRAW:\n🔵 Man City vs Real Madrid 🤍\n🔴 Liverpool vs Bayern Munich ⚽\n🟡 Dortmund vs Barcelona 🔵🔴\n🟠 Atletico vs Arsenal 🔴\n\nWho goes through? 🤔 #UCL #ChampionsLeague', likes:18920, comments:5632, reposts:7341, bookmarked:false, liked:false },
  { id:'p6', user:{name:'Lamine Yamal',handle:'LamineYamal',verified:true,color:'#ec4899',avatar:'LY'}, time:90, tag:'La Liga', text:'Happy with the performance tonight 💙❤️ Thanks for all the support @FCBarcelona fans. More to come 🙏 #ForçaBarça', likes:234891, comments:12043, reposts:41023, bookmarked:false, liked:false },
  { id:'p7', user:{name:'The Athletic',handle:'TheAthletic',verified:true,color:'#0ea5e9',avatar:'TA'}, time:120, tag:'UCL', text:'ANALYSIS: Why Real Madrid are clear favourites for the Champions League this season. Mbappé\'s integration, Bellingham\'s brilliance, Vinicius at his peak — the perfect storm. Thread 🧵 #RealMadrid #UCL', likes:5621, comments:891, reposts:2103, bookmarked:false, liked:false },
  { id:'p8', user:{name:'Mohamed Salah',handle:'MoSalah',verified:true,color:'#f59e0b',avatar:'MS'}, time:180, tag:'PL', text:'Always give 100% for this club and these fans. One game at a time. See you at Anfield on Saturday 🔴 #YNWA #LFC', likes:312049, comments:28940, reposts:89012, bookmarked:false, liked:false },
]

const PLAYERS = [
  { id:'pl1', name:'Erling Haaland', club:'Manchester City', pos:'ST', age:24, nat:'🇳🇴', color:'#0ea5e9', stats:{apps:32,goals:30,assists:8,rating:8.7,value:'€180M',contract:'2027'}, form:[8.2,9.1,7.8,8.9,9.2,7.5,8.8,9.0] },
  { id:'pl2', name:'Kylian Mbappé', club:'Real Madrid', pos:'ST', age:26, nat:'🇫🇷', color:'#1e3a8a', stats:{apps:31,goals:27,assists:11,rating:8.8,value:'€200M',contract:'2029'}, form:[8.5,8.9,7.2,9.1,8.7,8.4,7.9,8.6] },
  { id:'pl3', name:'Vinicius Jr', club:'Real Madrid', pos:'LW', age:24, nat:'🇧🇷', color:'#f59e0b', stats:{apps:30,goals:22,assists:14,rating:8.6,value:'€180M',contract:'2027'}, form:[7.9,8.8,9.1,8.2,7.6,9.0,8.4,8.7] },
  { id:'pl4', name:'Mohamed Salah', club:'Liverpool', pos:'RW', age:32, nat:'🇪🇬', color:'#e11d48', stats:{apps:33,goals:24,assists:17,rating:8.5,value:'€60M',contract:'2026'}, form:[8.8,7.9,8.5,9.0,8.1,8.7,7.6,8.9] },
  { id:'pl5', name:'Jude Bellingham', club:'Real Madrid', pos:'CAM', age:21, nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', color:'#7c3aed', stats:{apps:29,goals:18,assists:12,rating:8.4,value:'€200M',contract:'2029'}, form:[8.1,8.6,7.8,8.9,8.3,7.5,9.0,8.4] },
  { id:'pl6', name:'Lamine Yamal', club:'Barcelona', pos:'RW', age:17, nat:'🇪🇸', color:'#ec4899', stats:{apps:32,goals:16,assists:19,rating:8.3,value:'€120M',contract:'2026'}, form:[7.5,8.4,8.9,7.8,8.5,8.1,8.7,8.3] },
  { id:'pl7', name:'Pedri', club:'Barcelona', pos:'CM', age:22, nat:'🇪🇸', color:'#10b981', stats:{apps:28,goals:9,assists:11,rating:8.1,value:'€90M',contract:'2026'}, form:[8.0,7.6,8.3,8.1,7.9,8.4,7.7,8.2] },
  { id:'pl8', name:'Rodri', club:'Manchester City', pos:'CDM', age:28, nat:'🇪🇸', color:'#6366f1', stats:{apps:30,goals:5,assists:9,rating:8.7,value:'€120M',contract:'2027'}, form:[8.6,8.8,8.4,9.0,8.7,8.3,8.9,8.5] },
]

const LIVE_MATCHES = [
  { id:'m1', comp:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', minute:67, home:'Man City', away:'Arsenal', hs:2, as:0, hxg:'1.84', axg:'0.92', events:[{t:'⚽',min:23,text:'Haaland (23\')'},{t:'⚽',min:58,text:'Foden (58\')'},{t:'🟨',min:34,text:'Partey (34\')'},{t:'🔄',min:60,text:'Grealish → Doku (60\')'}], shotmap:{h:[{x:68,y:30,type:'goal'},{x:75,y:45,type:'saved'},{x:62,y:20,type:'goal'},{x:80,y:50,type:'missed'},{x:70,y:35,type:'saved'}],a:[{x:30,y:40,type:'saved'},{x:25,y:30,type:'missed'},{x:35,y:55,type:'missed'}]}, momentum:[1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1], motm:[{name:'Haaland',votes:421},{name:'Foden',votes:203},{name:'Rodri',votes:312},{name:'Saka',votes:89}], motmVoted:null },
  { id:'m2', comp:'🏆 Champions League', minute:45, home:'Real Madrid', away:'Bayern Munich', hs:1, as:1, hxg:'1.21', axg:'1.43', events:[{t:'⚽',min:12,text:'Mbappé (12\')'},{t:'⚽',min:38,text:'Kane (38\')'},{t:'🟨',min:28,text:'Camavinga (28\')'},{t:'🟨',min:41,text:'Kimmich (41\')'}], shotmap:{h:[{x:72,y:35,type:'goal'},{x:65,y:25,type:'saved'},{x:78,y:50,type:'missed'}],a:[{x:28,y:45,type:'goal'},{x:32,y:30,type:'saved'},{x:22,y:40,type:'missed'},{x:30,y:55,type:'missed'}]}, momentum:[0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1], motm:[{name:'Mbappé',votes:891},{name:'Bellingham',votes:412},{name:'Kane',votes:621},{name:'Alaba',votes:98}], motmVoted:null },
  { id:'m3', comp:'🇪🇸 La Liga', minute:81, home:'Barcelona', away:'Atletico', hs:3, as:2, hxg:'2.91', axg:'1.87', events:[{t:'⚽',min:8,text:'Yamal (8\')'},{t:'⚽',min:35,text:'Lewandowski (35\')'},{t:'🟥',min:52,text:'Witsel (52\')'},{t:'⚽',min:67,text:'Griezmann (67\')'},{t:'⚽',min:71,text:'Pedri (71\')'},{t:'⚽',min:79,text:'Correa (79\')'}], shotmap:{h:[{x:70,y:30,type:'goal'},{x:75,y:45,type:'goal'},{x:68,y:20,type:'goal'},{x:80,y:50,type:'saved'},{x:65,y:38,type:'missed'}],a:[{x:25,y:35,type:'goal'},{x:30,y:50,type:'goal'},{x:22,y:28,type:'missed'},{x:35,y:42,type:'saved'}]}, momentum:[1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,0,1,1], motm:[{name:'Yamal',votes:1203},{name:'Lewandowski',votes:891},{name:'Pedri',votes:654},{name:'Griezmann',votes:445}], motmVoted:null },
]

const UPCOMING = [
  { id:'f1', comp:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', home:'Liverpool', away:'Chelsea', time:'20:45 GMT', reminder:false },
  { id:'f2', comp:'🏆 Champions League', home:'Juventus', away:'PSG', time:'21:00 GMT', reminder:false },
  { id:'f3', comp:'🇩🇪 Bundesliga', home:'Bayern Munich', away:'Leverkusen', time:'18:30 GMT', reminder:false },
  { id:'f4', comp:'🇮🇹 Serie A', home:'Inter Milan', away:'AC Milan', time:'20:45 GMT', reminder:false },
]

const ROOMS = [
  { id:'r1', name:'🌍 Global Football', members:'128k', last:'Crazy result in Madrid tonight 🔥', time:'2m', unread:14, color:'#1DB954', avatar:'GF', msgs:[
    { id:'m1', user:'FootballFan99', color:'#e11d48', text:'Anyone watching the Madrid game?', time:'20:41' },
    { id:'m2', user:'KloppLover', color:'#0ea5e9', text:'Mbappé is on another level tonight 🔥', time:'20:42' },
    { id:'m3', user:'BarcaFanatic', color:'#7c3aed', text:'Real Madrid winning again... boring 😒', time:'20:43' },
    { id:'m4', user:'UnitedFan', color:'#f59e0b', text:'Wait til you see what happens in 2nd half', time:'20:44' },
    { id:'m5', user:'StatsBoy', color:'#10b981', text:'Kane\'s xG this season is unreal. 24.3 expected vs 27 actual. Clinical.', time:'20:45' },
    { id:'m6', user:'PremierLeaguePod', color:'#ec4899', text:'The UCL draw this week 😱 Man City vs Real Madrid again!', time:'20:46' },
  ]},
  { id:'r2', name:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', members:'84k', last:'Haaland is breaking every record', time:'5m', unread:7, color:'#3b82f6', avatar:'PL', msgs:[
    { id:'m1', user:'GoalMachine', color:'#e11d48', text:'Haaland just scored his 30th 🤯', time:'20:38' },
    { id:'m2', user:'ArsenalTill', color:'#f59e0b', text:'How do you stop this man???', time:'20:39' },
    { id:'m3', user:'CityFanatic', color:'#0ea5e9', text:'30 goals in 32 games. Don\'t look it up.', time:'20:40' },
    { id:'m4', user:'StatsGeek', color:'#7c3aed', text:'His conversion rate is 43%. That\'s R9 territory.', time:'20:41' },
    { id:'m5', user:'FootballPundit', color:'#10b981', text:'Arsenal defense has been a disaster tonight tbh', time:'20:42' },
    { id:'m6', user:'NorthLondon', color:'#ec4899', text:'We need Saliba back ASAP 🙏', time:'20:43' },
  ]},
  { id:'r3', name:'🔴 UCL Live', members:'201k', last:'WHAT A MATCH 🤩', time:'1m', unread:31, color:'#f59e0b', avatar:'CL', msgs:[
    { id:'m1', user:'ChampionsLeague', color:'#f59e0b', text:'📌 Welcome to UCL Live — share match reactions here! No spam.', time:'20:00', pinned:true },
    { id:'m2', user:'MadridFan', color:'#e11d48', text:'Mbappé first UCL goal for Madrid!! 🤍🤍🤍', time:'20:12' },
    { id:'m3', user:'BayernTill', color:'#e11d48', text:'Kane equalizes!! 1-1 from the spot 🔥', time:'20:38' },
    { id:'m4', user:'FootballLive', color:'#0ea5e9', text:'This game is INSANE. Best UCL match in years', time:'20:40' },
    { id:'m5', user:'UEFAWatcher', color:'#7c3aed', text:'Bellingham just went down in the box... VAR checking 👀', time:'20:43' },
    { id:'m6', user:'TacticsNerd', color:'#10b981', text:'Bayern pressing extremely high. Flick knows how to hurt RM.', time:'20:45' },
  ]},
  { id:'r4', name:'🇪🇸 La Liga', members:'61k', last:'Yamal with another assist 😤', time:'8m', unread:3, color:'#ec4899', avatar:'LL', msgs:[
    { id:'m1', user:'BarcaFan', color:'#ec4899', text:'Yamal is just 17 and playing like this??', time:'20:35' },
    { id:'m2', user:'LaLigaLover', color:'#0ea5e9', text:'El Clasico next week 🔥 Can\'t wait', time:'20:37' },
    { id:'m3', user:'MadridTill', color:'#7c3aed', text:'Vinicius is the best player in the world right now', time:'20:39' },
    { id:'m4', user:'FootieFan', color:'#f59e0b', text:'Barcelona 3-2 Atletico. Incredible game!', time:'20:42' },
    { id:'m5', user:'SpainFootball', color:'#10b981', text:'Spanish football is on another level this season', time:'20:43' },
    { id:'m6', user:'TikiTaka', color:'#e11d48', text:'Pedri masterclass in the 2nd half ✨', time:'20:44' },
  ]},
  { id:'r5', name:'💸 Transfer Room', members:'45k', last:'Romano just tweeted 👀', time:'15m', unread:0, color:'#6366f1', avatar:'TR', msgs:[
    { id:'m1', user:'TransferGuru', color:'#6366f1', text:'Mbappé to Al-Hilal confirmed by Romano 😳', time:'20:20' },
    { id:'m2', user:'FootballLeaks', color:'#f59e0b', text:'200M per year... that\'s just obscene money', time:'20:22' },
    { id:'m3', user:'MarketWatcher', color:'#0ea5e9', text:'Summer window going to be insane with that money circulating', time:'20:25' },
    { id:'m4', user:'AgentWatch', color:'#ec4899', text:'Haaland\'s release clause activates in June. €175M. United lurking.', time:'20:28' },
    { id:'m5', user:'TransferBible', color:'#e11d48', text:'Bellingham wants to stay at Madrid for life apparently', time:'20:30' },
    { id:'m6', user:'FootballInsider', color:'#10b981', text:'Salah contract standoff... Klopp\'s replacement might be the issue', time:'20:32' },
  ]},
]

const DMS = [
  { id:'d1', user:{name:'Alex Martinez', handle:'alexm', color:'#e11d48', avatar:'AM'}, lastSeen:'2 hours ago', msgs:[
    { id:'1', from:'them', text:'Did you see the Haaland goal?! 🔥', time:'20:30' },
    { id:'2', from:'me', text:'Insane! He\'s on another planet this season', time:'20:31' },
    { id:'3', from:'them', text:'City are going to win everything this year', time:'20:32' },
  ]},
  { id:'d2', user:{name:'Sofia Chen', handle:'sofiac', color:'#7c3aed', avatar:'SC'}, lastSeen:'online', msgs:[
    { id:'1', from:'them', text:'UCL draw was wild 😱', time:'19:45' },
    { id:'2', from:'me', text:'City vs Real Madrid again... Classic', time:'19:47' },
    { id:'3', from:'them', text:'Who do you think wins?', time:'19:48' },
    { id:'4', from:'me', text:'My heart says City but my head says Madrid 😅', time:'19:50' },
  ]},
  { id:'d3', user:{name:'Marcus Osei', handle:'marcosei', color:'#f59e0b', avatar:'MO'}, lastSeen:'30 minutes ago', msgs:[
    { id:'1', from:'me', text:'Barca game was unreal tonight', time:'18:55' },
    { id:'2', from:'them', text:'3-2 in the 81st minute. Football is incredible', time:'18:57' },
    { id:'3', from:'them', text:'Yamal at 17... what are we watching 🤯', time:'18:58' },
  ]},
]

const STANDINGS = {
  PL: [
    { pos:1, club:'Manchester City', p:30, w:22, d:5, l:3, gd:'+41', pts:71, form:['W','W','D','W','W'], color:'#0ea5e9' },
    { pos:2, club:'Arsenal', p:30, w:20, d:6, l:4, gd:'+35', pts:66, form:['W','W','W','L','W'], color:'#e11d48' },
    { pos:3, club:'Liverpool', p:30, w:19, d:7, l:4, gd:'+32', pts:64, form:['W','D','W','W','D'], color:'#e11d48' },
    { pos:4, club:'Aston Villa', p:30, w:18, d:4, l:8, gd:'+18', pts:58, form:['W','L','W','W','D'], color:'#7c3aed' },
    { pos:5, club:'Spurs', p:30, w:15, d:5, l:10, gd:'+11', pts:50, form:['L','W','D','W','L'], color:'#f2f2f2' },
    { pos:6, club:'Chelsea', p:30, w:14, d:7, l:9, gd:'+9', pts:49, form:['D','W','L','D','W'], color:'#3b82f6' },
    { pos:7, club:'Newcastle', p:30, w:13, d:6, l:11, gd:'+5', pts:45, form:['W','D','L','D','W'], color:'#f2f2f2' },
    { pos:8, club:'Man United', p:30, w:11, d:8, l:11, gd:'-2', pts:41, form:['L','L','D','W','L'], color:'#e11d48' },
    { pos:17, club:'Luton Town', p:30, w:5, d:8, l:17, gd:'-28', pts:23, form:['L','L','L','D','L'], color:'#f59e0b', rel:true },
    { pos:18, club:'Sheffield Utd', p:30, w:4, d:6, l:20, gd:'-39', pts:18, form:['L','L','D','L','L'], color:'#e11d48', rel:true },
    { pos:19, club:'Burnley', p:30, w:3, d:7, l:20, gd:'-42', pts:16, form:['L','D','L','L','L'], color:'#7c3aed', rel:true },
  ],
  LaLiga: [
    { pos:1, club:'Real Madrid', p:30, w:23, d:4, l:3, gd:'+48', pts:73, form:['W','W','W','D','W'], color:'#f2f2f2' },
    { pos:2, club:'Barcelona', p:30, w:21, d:5, l:4, gd:'+38', pts:68, form:['W','W','D','W','W'], color:'#3b82f6' },
    { pos:3, club:'Atletico Madrid', p:30, w:18, d:6, l:6, gd:'+22', pts:60, form:['D','W','W','L','W'], color:'#e11d48' },
    { pos:4, club:'Athletic Bilbao', p:30, w:16, d:5, l:9, gd:'+14', pts:53, form:['W','D','W','D','L'], color:'#e11d48' },
    { pos:5, club:'Villarreal', p:30, w:14, d:7, l:9, gd:'+8', pts:49, form:['L','W','D','W','W'], color:'#f59e0b' },
    { pos:6, club:'Real Sociedad', p:30, w:13, d:8, l:9, gd:'+5', pts:47, form:['D','D','W','L','D'], color:'#3b82f6' },
  ],
}

const TRANSFERS_CONFIRMED = [
  { id:'t1', player:'Kylian Mbappé', from:'Real Madrid', to:'Al-Hilal', fee:'Free', date:'Mar 2026', hot:true },
  { id:'t2', player:'Leny Yoro', from:'Lille', to:'Manchester United', fee:'€62M', date:'Feb 2026', hot:false },
  { id:'t3', player:'Sandro Tonali', from:'AC Milan', to:'Newcastle', fee:'€70M', date:'Feb 2026', hot:false },
  { id:'t4', player:'Khvicha Kvaratskhelia', from:'Napoli', to:'PSG', fee:'€70M', date:'Jan 2026', hot:true },
  { id:'t5', player:'João Neves', from:'Benfica', to:'PSG', fee:'€60M', date:'Jan 2026', hot:false },
  { id:'t6', player:'Mauro Icardi', from:'PSG', to:'Galatasaray', fee:'Free', date:'Jan 2026', hot:false },
]

const TRANSFERS_RUMOURS = [
  { id:'r1', player:'Erling Haaland', from:'Man City', to:'Real Madrid', fee:'€175M', stars:4, source:'Marca' },
  { id:'r2', player:'Pedri', from:'Barcelona', to:'Bayern Munich', fee:'€100M', stars:2, source:'Sport BILD' },
  { id:'r3', player:'Rodri', from:'Man City', to:'Barcelona', fee:'€130M', stars:3, source:'The Athletic' },
  { id:'r4', player:'Mohamed Salah', from:'Liverpool', to:'Al-Ittihad', fee:'Free', stars:4, source:'BBC Sport' },
  { id:'r5', player:'Marcus Rashford', from:'Man United', to:'Barcelona', fee:'€60M', stars:3, source:'Fabrizio Romano' },
]

const PREDICTIONS_FIXTURES = [
  { id:'pf1', home:'Liverpool', away:'Chelsea', comp:'Premier League', date:'Sat 8 Mar' },
  { id:'pf2', home:'Man City', away:'Real Madrid', comp:'Champions League', date:'Tue 11 Mar' },
  { id:'pf3', home:'Bayern', away:'Leverkusen', comp:'Bundesliga', date:'Sat 8 Mar' },
  { id:'pf4', home:'Inter', away:'AC Milan', comp:'Serie A', date:'Sun 9 Mar' },
]

const LEADERBOARD = [
  { rank:1, name:'PredictionKing', pts:2840, badge:'🥇' },
  { rank:2, name:'StatsMaster', pts:2610, badge:'🥈' },
  { rank:3, name:'FootballOracle', pts:2450, badge:'🥉' },
  { rank:4, name:'GoalGuru', pts:2201, badge:'4️⃣' },
  { rank:5, name:'TacticsNerd', pts:1980, badge:'5️⃣' },
]

const BADGES_DATA = [
  { id:'b1', name:'First Post', icon:'⚽', desc:'Posted your first update', earned:true },
  { id:'b2', name:'100 Likes', icon:'🔥', desc:'Received 100 likes total', earned:true },
  { id:'b3', name:'7-Day Streak', icon:'📅', desc:'Logged in 7 days in a row', earned:true },
  { id:'b4', name:'Top Fan: Arsenal', icon:'❤️', desc:'Consistent Arsenal content', earned:true },
  { id:'b5', name:'Prediction Master', icon:'🎯', desc:'10 correct predictions', earned:false },
  { id:'b6', name:'UCL Watcher', icon:'🏆', desc:'Watch all UCL matches live', earned:false },
  { id:'b7', name:'Transfer Guru', icon:'💸', desc:'Follow 20 transfer news', earned:false },
  { id:'b8', name:'Goal Machine', icon:'⚽⚽⚽', desc:'Post about 50 goals', earned:false },
]

const NOTIFICATIONS = [
  { id:'n1', text:'Fabrizio Romano liked your post', time:'2m', read:false, icon:'❤️' },
  { id:'n2', text:'@SkySportsNews replied: "Great take on the transfer!"', time:'5m', read:false, icon:'💬' },
  { id:'n3', text:'UCL Official started following you', time:'12m', read:false, icon:'👤' },
  { id:'n4', text:'⚽ GOAL ALERT: Haaland 67\' — Man City 2-0 Arsenal', time:'18m', read:false, icon:'⚽' },
  { id:'n5', text:'Your prediction was correct! +50 pts earned', time:'1h', read:true, icon:'🎯' },
  { id:'n6', text:'Mohamed Salah liked your comment', time:'2h', read:true, icon:'❤️' },
  { id:'n7', text:'Transfer Deadline: Mbappé to Al-Hilal confirmed', time:'3h', read:true, icon:'💸' },
  { id:'n8', text:'Man City vs Real Madrid — Match starts in 1 hour', time:'4h', read:true, icon:'🔔' },
]

const TRENDING = ['#UCLFinal','#Haaland','#TransferDeadline','#ElClasico','#Mbappe','#LaLiga','#PL']

/* ─── HELPERS ─────────────────────────────────────────────── */
const S = {
  bg: '#0e0e0e', card: '#161616', border: '#1f1f1f',
  green: '#1DB954', red: '#ef4444', gold: '#f4c430',
  text: '#f2f2f2', muted: '#666', sub: '#999',
}
const flex = (align='center', justify='flex-start', dir='row') => ({ display:'flex', alignItems:align, justifyContent:justify, flexDirection:dir })
const card = (extra={}) => ({ background:S.card, borderRadius:12, padding:16, ...extra })

function Av({ name, color, size=36, style={} }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color||userColor(name), ...flex('center','center'), fontSize:size*0.35, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:'DM Sans, sans-serif', ...style }}>
      {initials(name)}
    </div>
  )
}

function Pill({ children, active, onClick, color, style={} }) {
  return (
    <button onClick={onClick} style={{ padding:'5px 14px', borderRadius:20, background: active ? (color||S.green) : '#1a1a1a', color: active ? (color?'#fff':S.bg) : S.muted, border:`1px solid ${active?(color||S.green):'#2a2a2a'}`, fontSize:13, fontWeight:600, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap', ...style }}>
      {children}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={()=>onChange(!checked)} style={{ width:46, height:26, borderRadius:13, background: checked ? S.green : '#333', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left: checked?22:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
    </div>
  )
}

function Spinner() {
  return <div style={{ width:20, height:20, border:'2px solid #333', borderTop:`2px solid ${S.green}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
  </div>
}

/* ─── AI CALL ─────────────────────────────────────────────── */
async function callClaude(systemPrompt, userMsg, apiKey) {
  if (!apiKey) return 'AI responses require an API key. Add your Anthropic API key in Settings to enable this feature.'
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:systemPrompt, messages:[{role:'user',content:userMsg}] })
    })
    const d = await res.json()
    return d.content?.[0]?.text || 'No response.'
  } catch(e) { return 'Failed to reach AI. Check your API key.' }
}


/* ─── FEED TAB ─────────────────────────────────────────────── */
function FeedTab({ apiKey }) {
  const [posts, setPosts] = useState(POSTS)
  const [text, setText] = useState('')
  const [showPoll, setShowPoll] = useState(false)
  const [pollA, setPollA] = useState('')
  const [pollB, setPollB] = useState('')
  const [gpText, setGpText] = useState('')
  const [gpReply, setGpReply] = useState('')
  const [gpLoading, setGpLoading] = useState(false)
  const [filterTag, setFilterTag] = useState(null)
  const [quotePost, setQuotePost] = useState(null)
  const [quoteText, setQuoteText] = useState('')
  const [likeAnim, setLikeAnim] = useState(null)

  const handleLike = (id) => {
    setLikeAnim(id)
    setTimeout(()=>setLikeAnim(null),400)
    setPosts(ps=>ps.map(p=>p.id===id?{...p,liked:!p.liked,likes:p.liked?p.likes-1:p.likes+1}:p))
  }
  const handleBookmark = (id) => setPosts(ps=>ps.map(p=>p.id===id?{...p,bookmarked:!p.bookmarked}:p))
  const handleVote = (postId, optIdx) => {
    setPosts(ps=>ps.map(p=>{
      if(p.id!==postId||!p.poll||p.poll.voted!==null)return p
      const opts=[...p.poll.options]
      opts[optIdx]={...opts[optIdx],votes:opts[optIdx].votes+1}
      return {...p,poll:{...p.poll,options:opts,voted:optIdx}}
    }))
  }
  const handlePost = () => {
    if(!text.trim()&&!quotePost)return
    const np={
      id:'p'+Date.now(), user:CURRENT_USER, time:0, tag:'PL',
      text:quotePost?quoteText:text, likes:0, comments:0, reposts:0, bookmarked:false, liked:false,
      quote:quotePost||null,
      poll:showPoll&&pollA&&pollB?{question:'Poll',options:[{text:pollA,votes:0},{text:pollB,votes:0}],voted:null}:undefined
    }
    setPosts(ps=>[np,...ps]); setText(''); setPollA(''); setPollB(''); setShowPoll(false); setQuotePost(null); setQuoteText('')
  }
  const handleGP = async()=>{
    if(!gpText.trim())return
    setGpLoading(true); setGpReply('')
    const r=await callClaude('You are FootballGPT, the world sharpest football analyst. Answer in 2-3 punchy sentences. Be direct, passionate. No filler.', gpText, apiKey)
    setGpReply(r); setGpLoading(false)
  }

  const filtered=filterTag?posts.filter(p=>p.text.includes(filterTag)||p.tag===filterTag.replace('#','')):posts
  const formatText=(txt)=>{
    return txt.split(/(#\w+|@\w+)/g).map((p,i)=>(p.startsWith('#')||p.startsWith('@'))?<span key={i} style={{color:S.green}}>{p}</span>:<span key={i}>{p}</span>)
  }
  const totalVotes=(poll)=>poll.options.reduce((s,o)=>s+o.votes,0)||1

  return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',overflowX:'auto',borderBottom:'1px solid '+S.border}}>
        {TRENDING.map(t=>(
          <Pill key={t} active={filterTag===t} onClick={()=>setFilterTag(filterTag===t?null:t)} style={{fontSize:12}}>{t}</Pill>
        ))}
      </div>

      <div style={{background:S.card,borderRadius:12,padding:16,margin:16,marginBottom:0,border:'1px solid '+S.border}}>
        <div style={{marginBottom:10}}>
          <span style={{fontFamily:'Bebas Neue',fontSize:18,color:S.green,letterSpacing:1}}>&#9889; FOOTBALLGPT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <input value={gpText} onChange={e=>setGpText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleGP()} placeholder='Ask anything about football...' style={{flex:1,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14}} />
          <button onClick={handleGP} style={{background:S.green,color:S.bg,padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:14,fontFamily:'DM Sans, sans-serif'}}>ASK</button>
        </div>
        {gpLoading&&<div style={{display:'flex',alignItems:'center',gap:8,marginTop:10,color:S.muted,fontSize:14}}><Spinner/><span>Analyzing...</span></div>}
        {gpReply&&<div style={{marginTop:10,padding:12,background:'#0e0e0e',borderRadius:8,borderLeft:'3px solid '+S.green,color:S.text,fontSize:14,lineHeight:1.6,fontFamily:'DM Sans, sans-serif'}}>{gpReply}</div>}
      </div>

      <div style={{background:S.card,borderRadius:12,padding:16,margin:16,border:'1px solid '+S.border}}>
        {quotePost&&(
          <div style={{background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:10,marginBottom:10,fontSize:13,color:S.sub}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <b style={{color:S.text}}>@{quotePost.user.handle}</b>
              <button onClick={()=>setQuotePost(null)} style={{color:S.muted,fontSize:18,lineHeight:1}}>&#215;</button>
            </div>
            <p style={{marginTop:2,color:S.muted}}>{quotePost.text.slice(0,80)}...</p>
          </div>
        )}
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <Av name={CURRENT_USER.name} color={CURRENT_USER.color} size={38}/>
          <textarea
            value={quotePost?quoteText:text}
            onChange={e=>quotePost?setQuoteText(e.target.value):setText(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)handlePost()}}
            placeholder="What's happening in football? &#127967;"
            maxLength={280} rows={3}
            style={{flex:1,background:'transparent',border:'none',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:15,lineHeight:1.5}}
          />
        </div>
        {showPoll&&(
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
            <input value={pollA} onChange={e=>setPollA(e.target.value)} placeholder="Option A" style={{width:'100%',background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14}}/>
            <input value={pollB} onChange={e=>setPollB(e.target.value)} placeholder="Option B" style={{width:'100%',background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14}}/>
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12,borderTop:'1px solid '+S.border,paddingTop:10}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            {['&#128247;','&#127909;','&#128516;'].map(ic=>(
              <button key={ic} style={{fontSize:18,padding:'4px 8px',borderRadius:8,color:S.sub}}>
                {decodeEntity(ic)}
              </button>
            ))}
            <button onClick={()=>setShowPoll(!showPoll)} style={{fontSize:18,padding:'4px 8px',borderRadius:8,color:showPoll?S.green:S.sub}}>&#128202;</button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:12,color:S.muted}}>{(quotePost?quoteText:text).length}/280</span>
            <button onClick={handlePost} style={{background:S.green,color:S.bg,padding:'7px 20px',borderRadius:20,fontWeight:700,fontSize:14,fontFamily:'DM Sans, sans-serif'}}>Post</button>
          </div>
        </div>
      </div>

      {filtered.map(post=>(
        <div key={post.id} style={{borderBottom:'1px solid '+S.border,padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <Av name={post.user.name} color={post.user.color} size={40}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <span style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{post.user.name}</span>
                {post.user.verified&&<span style={{color:'#3b82f6',fontSize:13}}>&#10003;</span>}
                <span style={{color:S.muted,fontSize:13}}>@{post.user.handle} &middot; {timeAgo(post.time)}</span>
                <span style={{background:'#1a1a1a',color:S.sub,fontSize:11,padding:'2px 8px',borderRadius:20,border:'1px solid '+S.border}}>{post.tag}</span>
              </div>
              <p style={{marginTop:6,fontSize:14,lineHeight:1.65,color:S.text,fontFamily:'DM Sans, sans-serif',whiteSpace:'pre-wrap'}}>{formatText(post.text)}</p>
              {post.quote&&(
                <div style={{margin:'8px 0',padding:10,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,fontSize:13}}>
                  <b style={{color:post.quote.user.color}}>@{post.quote.user.handle}</b>
                  <p style={{color:S.sub,marginTop:2}}>{post.quote.text.slice(0,100)}...</p>
                </div>
              )}
              {post.poll&&(()=>{
                const total=totalVotes(post.poll)
                return(
                  <div style={{marginTop:10}}>
                    {post.poll.options.map((opt,i)=>{
                      const pct=Math.round((opt.votes/total)*100)
                      const voted=post.poll.voted===i
                      return(
                        <div key={i} onClick={()=>handleVote(post.id,i)} style={{marginBottom:8,cursor:'pointer'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:13,color:voted?S.green:S.text,fontWeight:voted?700:400}}>{opt.text}</span>
                            <span style={{fontSize:12,color:S.muted}}>{pct}%</span>
                          </div>
                          <div style={{height:6,background:'#1a1a1a',borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',width:pct+'%',background:voted?S.green:'#333',borderRadius:3,transition:'width 0.4s'}}/>
                          </div>
                        </div>
                      )
                    })}
                    <span style={{fontSize:12,color:S.muted}}>{total.toLocaleString()} votes</span>
                  </div>
                )
              })()}
              <div style={{display:'flex',alignItems:'center',marginTop:10}}>
                {[
                  {icon:'&#9825;',active:post.liked,count:post.likes,onClick:()=>handleLike(post.id),anim:likeAnim===post.id,activeColor:S.green},
                  {icon:'&#128172;',count:post.comments,onClick:()=>{}},
                  {icon:'&#8635;',count:post.reposts,onClick:()=>{}},
                  {icon:'&#8220;',onClick:()=>setQuotePost(post)},
                  {icon:'&#128278;',active:post.bookmarked,onClick:()=>handleBookmark(post.id),activeColor:S.gold},
                  {icon:'&#8599;',onClick:()=>{}},
                ].map((a,i)=>(
                  <button key={i} onClick={a.onClick} className={a.anim?'bounce-like':''} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'6px 0',color:a.active?(a.activeColor||S.green):S.muted,fontSize:13,fontFamily:'DM Sans, sans-serif',flex:1}}>
                    <span style={{fontSize:15}}>{decodeEntity(a.icon)}</span>
                    {a.count!==undefined&&<span style={{fontSize:12}}>{a.count>999?(a.count/1000).toFixed(1)+'k':a.count}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


/* ─── CHAT TAB ─────────────────────────────────────────────── */
function ChatTab() {
  const [rooms, setRooms] = useState(ROOMS)
  const [dms, setDms] = useState(DMS)
  const [activeRoom, setActiveRoom] = useState(null)
  const [activeDm, setActiveDm] = useState(null)
  const [msgInput, setMsgInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)

  const openRoom = (r) => { setActiveRoom({...r, msgs:[...r.msgs]}); setActiveDm(null); setMsgInput('') }
  const openDm = (d) => { setActiveDm({...d, msgs:[...d.msgs]}); setActiveRoom(null); setMsgInput('') }

  const sendMsg = () => {
    if(!msgInput.trim()) return
    const nm = { id:'m'+Date.now(), from:'me', user:CURRENT_USER.name, color:CURRENT_USER.color, text:msgInput, time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
    if(activeRoom) {
      setActiveRoom(r=>({...r, msgs:[...r.msgs, nm]}))
    } else if(activeDm) {
      setActiveDm(d=>({...d, msgs:[...d.msgs, {...nm, from:'me'}]}))
    }
    setMsgInput('')
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),50)
  }

  const filteredRooms = rooms.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()))

  if(activeRoom || activeDm) {
    const conv = activeRoom || activeDm
    const title = activeRoom ? activeRoom.name : activeDm.user.name
    const subtitle = activeRoom ? activeRoom.members+' members' : 'last seen '+activeDm.user.lastSeen
    const msgs = conv.msgs || []
    const pinned = msgs.find(m=>m.pinned)

    return (
      <div className="tab-in" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 60px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid '+S.border,background:S.card,flexShrink:0}}>
          <button onClick={()=>{setActiveRoom(null);setActiveDm(null)}} style={{color:S.text,fontSize:20,padding:4}}>&#8592;</button>
          {activeRoom ? (
            <Av name={activeRoom.name} color={activeRoom.color} size={38}/>
          ) : (
            <Av name={activeDm.user.name} color={activeDm.user.color} size={38}/>
          )}
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{title}</div>
            <div style={{fontSize:12,color:activeRoom?S.green:S.sub,fontFamily:'DM Sans, sans-serif'}}>{subtitle}</div>
          </div>
        </div>
        {pinned&&(
          <div style={{padding:'8px 16px',background:'#1a1a1a',borderBottom:'1px solid '+S.border,fontSize:12,color:S.sub,fontFamily:'DM Sans, sans-serif',flexShrink:0}}>
            {pinned.text}
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
          {msgs.filter(m=>!m.pinned).map(m=>{
            const isSelf = m.from==='me'
            return (
              <div key={m.id} className="msg-in" style={{display:'flex',flexDirection:isSelf?'row-reverse':'row',alignItems:'flex-end',gap:8}}>
                {!isSelf&&<Av name={m.user||'?'} color={m.color||'#555'} size={28}/>}
                <div style={{maxWidth:'72%'}}>
                  {!isSelf&&<div style={{fontSize:11,color:m.color||S.muted,marginBottom:3,fontWeight:600,fontFamily:'DM Sans, sans-serif'}}>{m.user}</div>}
                  <div style={{background:isSelf?S.green:'#1e1e1e',color:isSelf?S.bg:'#e0e0e0',padding:'9px 13px',borderRadius:isSelf?'16px 16px 4px 16px':'16px 16px 16px 4px',fontSize:14,lineHeight:1.5,fontFamily:'DM Sans, sans-serif',wordBreak:'break-word'}}>
                    {m.text}
                  </div>
                  <div style={{fontSize:11,color:S.muted,marginTop:3,textAlign:isSelf?'right':'left'}}>{m.time}</div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:'12px 16px',borderTop:'1px solid '+S.border,display:'flex',alignItems:'center',gap:10,background:S.card,flexShrink:0}}>
          <button style={{color:S.muted,fontSize:22}}>&#128516;</button>
          <input
            value={msgInput} onChange={e=>setMsgInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&sendMsg()}
            placeholder="Message..."
            style={{flex:1,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:20,padding:'9px 14px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14}}
          />
          <button onClick={sendMsg} style={{width:38,height:38,borderRadius:'50%',background:S.green,color:S.bg,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>&#8594;</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid '+S.border}}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search chats..."
          style={{width:'100%',background:S.card,border:'1px solid '+S.border,borderRadius:10,padding:'10px 14px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14}}
        />
      </div>
      <div style={{padding:'12px 16px 4px',fontSize:12,color:S.muted,fontWeight:600,fontFamily:'DM Sans, sans-serif',letterSpacing:1}}>ROOMS</div>
      {filteredRooms.map(r=>(
        <div key={r.id} onClick={()=>openRoom(r)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid '+S.border,cursor:'pointer',background:'transparent'}}>
          <Av name={r.name} color={r.color} size={48}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{r.name}</span>
              <span style={{fontSize:12,color:S.muted}}>{r.time}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:3}}>
              <span style={{fontSize:13,color:S.muted,fontFamily:'DM Sans, sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{r.last}</span>
              {r.unread>0&&<span style={{background:S.green,color:S.bg,fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:10,flexShrink:0}}>{r.unread}</span>}
            </div>
            <div style={{fontSize:11,color:S.muted,marginTop:2}}>{r.members} members</div>
          </div>
        </div>
      ))}
      <div style={{padding:'12px 16px 4px',fontSize:12,color:S.muted,fontWeight:600,fontFamily:'DM Sans, sans-serif',letterSpacing:1,marginTop:8}}>DIRECT MESSAGES</div>
      {dms.map(d=>(
        <div key={d.id} onClick={()=>openDm(d)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid '+S.border,cursor:'pointer'}}>
          <div style={{position:'relative'}}>
            <Av name={d.user.name} color={d.user.color} size={48}/>
            {d.user.lastSeen==='online'&&<div style={{position:'absolute',bottom:2,right:2,width:10,height:10,borderRadius:'50%',background:S.green,border:'2px solid '+S.bg}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{d.user.name}</div>
            <div style={{fontSize:13,color:S.muted,fontFamily:'DM Sans, sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.msgs[d.msgs.length-1].text}</div>
          </div>
          <div style={{fontSize:12,color:d.user.lastSeen==='online'?S.green:S.muted}}>{d.user.lastSeen==='online'?'Online':d.user.lastSeen}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── LIVE TAB ─────────────────────────────────────────────── */
function ShotMap({ shots }) {
  return (
    <svg viewBox="0 0 160 100" style={{width:'100%',maxWidth:200,height:'auto',background:'#111',borderRadius:8,border:'1px solid '+S.border}}>
      <rect x={10} y={5} width={140} height={90} fill="none" stroke="#333" strokeWidth={1.5}/>
      <rect x={45} y={5} width={70} height={28} fill="none" stroke="#333" strokeWidth={1}/>
      <rect x={60} y={5} width={40} height={14} fill="none" stroke="#333" strokeWidth={1}/>
      <line x1={80} y1={5} x2={80} y2={95} stroke="#333" strokeWidth={1} strokeDasharray="4,3"/>
      {shots.map((s,i)=>(
        <circle key={i} cx={s.x} cy={s.y} r={4}
          fill={s.type==='goal'?S.green:s.type==='saved'?'#fff':'#555'}
          stroke={s.type==='goal'?S.green:s.type==='saved'?'#888':'#333'}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

function MomentumBar({ bars }) {
  return (
    <div>
      <div style={{fontSize:11,color:S.muted,marginBottom:6,fontFamily:'DM Sans, sans-serif'}}>Attack Momentum — Last 10 mins</div>
      <div style={{display:'flex',gap:2,height:20}}>
        {bars.map((b,i)=>(
          <div key={i} style={{flex:1,background:b===1?S.green:S.red,borderRadius:2,opacity:0.85}}/>
        ))}
      </div>
    </div>
  )
}

function LiveTab({ apiKey }) {
  const [matches, setMatches] = useState(LIVE_MATCHES)
  const [upcoming, setUpcoming] = useState(UPCOMING)
  const [filter, setFilter] = useState('All')
  const [aiPreviews, setAiPreviews] = useState({})
  const [aiLoading, setAiLoading] = useState({})

  const toggleReminder = (id) => setUpcoming(us=>us.map(u=>u.id===id?{...u,reminder:!u.reminder}:u))
  const voteMotm = (matchId, idx) => {
    setMatches(ms=>ms.map(m=>{
      if(m.id!==matchId||m.motmVoted!==null)return m
      const mv=[...m.motm]
      mv[idx]={...mv[idx],votes:mv[idx].votes+1}
      return {...m,motm:mv,motmVoted:idx}
    }))
  }
  const handlePreview = async(fix) => {
    setAiLoading(l=>({...l,[fix.id]:true}))
    const r=await callClaude('You are a football analyst. Write a concise 2-sentence match preview. Be analytical and mention team form or key players.', fix.home+' vs '+fix.away+' in the '+fix.comp, apiKey)
    setAiPreviews(p=>({...p,[fix.id]:r}))
    setAiLoading(l=>({...l,[fix.id]:false}))
  }

  const filterPills=['All','PL','UCL','La Liga','Bundesliga','Serie A']

  return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',overflowX:'auto',borderBottom:'1px solid '+S.border}}>
        {filterPills.map(f=><Pill key={f} active={filter===f} onClick={()=>setFilter(f)}>{f}</Pill>)}
      </div>

      <div style={{padding:'12px 16px 4px',fontSize:12,color:S.red,fontWeight:700,fontFamily:'DM Sans, sans-serif',letterSpacing:1,display:'flex',alignItems:'center',gap:6}}>
        <span className="pulse" style={{width:8,height:8,borderRadius:'50%',background:S.red,display:'inline-block'}}/>
        LIVE MATCHES
      </div>

      {matches.map(m=>{
        const pct=Math.min(100,(m.minute/90)*100)
        const totalMotm=m.motm.reduce((s,p)=>s+p.votes,0)||1
        return (
          <div key={m.id} style={{background:S.card,borderRadius:12,margin:'8px 16px',border:'1px solid '+S.border,overflow:'hidden'}}>
            <div style={{padding:'12px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <span style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>{m.comp}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span className="pulse" style={{width:7,height:7,borderRadius:'50%',background:S.red,display:'inline-block'}}/>
                  <span style={{fontSize:12,color:S.red,fontWeight:700,fontFamily:'DM Sans, sans-serif'}}>{m.minute}'</span>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:18,fontWeight:800,color:S.text,fontFamily:'DM Sans, sans-serif',flex:1}}>{m.home}</span>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'4px 16px'}}>
                  <span style={{fontSize:32,fontWeight:800,color:S.text,fontFamily:'Bebas Neue',letterSpacing:2}}>{m.hs}</span>
                  <span style={{fontSize:20,color:S.muted,fontFamily:'Bebas Neue'}}>-</span>
                  <span style={{fontSize:32,fontWeight:800,color:S.text,fontFamily:'Bebas Neue',letterSpacing:2}}>{m.as}</span>
                </div>
                <span style={{fontSize:18,fontWeight:800,color:S.text,fontFamily:'DM Sans, sans-serif',flex:1,textAlign:'right'}}>{m.away}</span>
              </div>
              <div style={{height:3,background:'#1a1a1a',borderRadius:2,marginBottom:8}}>
                <div style={{height:'100%',width:pct+'%',background:S.green,borderRadius:2}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:12}}>
                <span>xG: {m.hxg}</span><span>xG: {m.axg}</span>
              </div>
              <MomentumBar bars={m.momentum}/>
              <div style={{marginTop:12,display:'flex',gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:S.muted,marginBottom:6,fontFamily:'DM Sans, sans-serif',fontWeight:600}}>HOME SHOTS</div>
                  <ShotMap shots={m.shotmap.h}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:S.muted,marginBottom:6,fontFamily:'DM Sans, sans-serif',fontWeight:600}}>AWAY SHOTS</div>
                  <ShotMap shots={m.shotmap.a}/>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:11,color:S.muted,fontWeight:600,fontFamily:'DM Sans, sans-serif',marginBottom:8}}>MATCH EVENTS</div>
                {m.events.map((ev,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:13,color:S.sub,fontFamily:'DM Sans, sans-serif'}}>
                    <span style={{fontSize:16}}>{ev.t}</span>
                    <span>{ev.text}</span>
                  </div>
                ))}
              </div>
              {m.minute>=80&&(
                <div style={{marginTop:12,padding:12,background:'#0e0e0e',borderRadius:8,border:'1px solid '+S.border}}>
                  <div style={{fontSize:12,fontWeight:700,color:S.gold,marginBottom:8,fontFamily:'DM Sans, sans-serif'}}>&#11088; VOTE MAN OF THE MATCH</div>
                  {m.motm.map((p,i)=>{
                    const pct=Math.round((p.votes/totalMotm)*100)
                    const voted=m.motmVoted===i
                    return (
                      <div key={i} onClick={()=>voteMotm(m.id,i)} style={{marginBottom:6,cursor:'pointer'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:13,color:voted?S.gold:S.text,fontWeight:voted?700:400,fontFamily:'DM Sans, sans-serif'}}>{p.name}</span>
                          <span style={{fontSize:12,color:S.muted}}>{pct}%</span>
                        </div>
                        <div style={{height:5,background:'#1a1a1a',borderRadius:3}}>
                          <div style={{height:'100%',width:pct+'%',background:voted?S.gold:'#333',borderRadius:3,transition:'width 0.4s'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div style={{padding:'16px 16px 4px',fontSize:12,color:S.muted,fontWeight:700,fontFamily:'DM Sans, sans-serif',letterSpacing:1}}>TODAY'S FIXTURES</div>
      {upcoming.map(fix=>(
        <div key={fix.id} style={{background:S.card,borderRadius:12,margin:'8px 16px',padding:'14px',border:'1px solid '+S.border}}>
          <div style={{fontSize:11,color:S.muted,marginBottom:6,fontFamily:'DM Sans, sans-serif'}}>{fix.comp}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:15,fontWeight:700,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{fix.home}</span>
            <span style={{fontSize:13,fontWeight:700,color:S.green,fontFamily:'Bebas Neue',letterSpacing:1,padding:'4px 10px',background:'#0e0e0e',borderRadius:8}}>{fix.time}</span>
            <span style={{fontSize:15,fontWeight:700,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{fix.away}</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>toggleReminder(fix.id)} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+(fix.reminder?S.green:S.border),background:fix.reminder?'rgba(29,185,84,0.1)':'transparent',color:fix.reminder?S.green:S.muted,fontSize:12,fontWeight:600,fontFamily:'DM Sans, sans-serif'}}>
              {fix.reminder?'&#10003; Reminder Set':'&#9201; Set Reminder'}
            </button>
            <button onClick={()=>handlePreview(fix)} disabled={aiLoading[fix.id]} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+S.border,background:'transparent',color:S.green,fontSize:12,fontWeight:600,fontFamily:'DM Sans, sans-serif'}}>
              {aiLoading[fix.id]?'Loading...':'&#9889; AI Preview'}
            </button>
          </div>
          {aiPreviews[fix.id]&&(
            <div style={{marginTop:10,padding:10,background:'#0e0e0e',borderRadius:8,borderLeft:'3px solid '+S.green,fontSize:13,color:S.text,lineHeight:1.6,fontFamily:'DM Sans, sans-serif'}}>{aiPreviews[fix.id]}</div>
          )}
        </div>
      ))}
    </div>
  )
}


/* ─── PLAYERS TAB ───────────────────────────────────────────── */
function PlayersTab({ apiKey }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Goals')
  const [expanded, setExpanded] = useState(null)
  const [scouts, setScouts] = useState({})
  const [scoutLoading, setScoutLoading] = useState({})

  const positions = ['All','FW','MF','DF','GK']
  const posMap = {ST:'FW',LW:'FW',RW:'FW',CAM:'MF',CM:'MF',CDM:'MF',CB:'DF',LB:'DF',RB:'DF',GK:'GK'}

  const filtered = PLAYERS
    .filter(p=>{
      const matchSearch=p.name.toLowerCase().includes(search.toLowerCase())||p.club.toLowerCase().includes(search.toLowerCase())
      const matchPos=filter==='All'||posMap[p.pos]===filter
      return matchSearch&&matchPos
    })
    .sort((a,b)=>{
      if(sort==='Goals')return b.stats.goals-a.stats.goals
      if(sort==='Assists')return b.stats.assists-a.stats.assists
      if(sort==='Rating')return b.stats.rating-a.stats.rating
      return 0
    })

  const handleScout = async(p) => {
    setScoutLoading(l=>({...l,[p.id]:true}))
    const r=await callClaude('You are a top football scout. Write a concise 3-sentence scout report. Be analytical, specific about strengths, weaknesses, and current form.', p.name+' plays '+p.pos+' for '+p.club+'. Age: '+p.age+'. Stats this season: '+p.stats.goals+' goals, '+p.stats.assists+' assists, '+p.stats.apps+' appearances, '+p.stats.rating+' average rating.', apiKey)
    setScouts(s=>({...s,[p.id]:r}))
    setScoutLoading(l=>({...l,[p.id]:false}))
  }

  return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid '+S.border}}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search players..."
          style={{width:'100%',background:S.card,border:'1px solid '+S.border,borderRadius:10,padding:'10px 14px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:14,marginBottom:10}}
        />
        <div style={{display:'flex',alignItems:'center',gap:8,overflowX:'auto'}}>
          {positions.map(p=><Pill key={p} active={filter===p} onClick={()=>setFilter(p)}>{p}</Pill>)}
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{marginLeft:'auto',background:'#1a1a1a',border:'1px solid '+S.border,borderRadius:8,padding:'5px 10px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:13}}>
            {['Goals','Assists','Rating'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {filtered.map(p=>{
        const isExp=expanded===p.id
        const maxForm=Math.max(...p.form)
        return (
          <div key={p.id} style={{borderBottom:'1px solid '+S.border}}>
            <div onClick={()=>setExpanded(isExp?null:p.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer'}}>
              <Av name={p.name} color={p.color} size={46}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{p.name}</span>
                  <span style={{fontSize:15}}>{p.nat}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3}}>
                  <span style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>{p.club}</span>
                  <span style={{fontSize:11,padding:'2px 7px',borderRadius:10,background:'#1a1a1a',color:S.sub,border:'1px solid '+S.border}}>{p.pos}</span>
                  <span style={{fontSize:12,color:S.muted}}>Age {p.age}</span>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:28,fontWeight:800,color:S.green,fontFamily:'Bebas Neue',lineHeight:1}}>{p.stats.goals}</div>
                <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>Goals</div>
              </div>
            </div>
            {isExp&&(
              <div style={{padding:'0 16px 16px',background:'#111'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
                  {[
                    {label:'Apps',val:p.stats.apps},
                    {label:'Goals',val:p.stats.goals},
                    {label:'Assists',val:p.stats.assists},
                    {label:'Market Value',val:p.stats.value},
                    {label:'Contract',val:p.stats.contract},
                  ].map(s=>(
                    <div key={s.label} style={{background:S.card,borderRadius:8,padding:'10px 12px',border:'1px solid '+S.border}}>
                      <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:4}}>{s.label}</div>
                      <div style={{fontSize:18,fontWeight:700,color:S.text,fontFamily:'Bebas Neue',letterSpacing:0.5}}>{s.val}</div>
                    </div>
                  ))}
                  <div style={{background:S.card,borderRadius:8,padding:'10px 12px',border:'1px solid '+S.border}}>
                    <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:4}}>Rating</div>
                    <div style={{fontSize:18,fontWeight:700,color:S.green,fontFamily:'Bebas Neue'}}>{p.stats.rating}</div>
                    <div style={{height:4,background:'#1a1a1a',borderRadius:2,marginTop:4}}>
                      <div style={{height:'100%',width:((p.stats.rating/10)*100)+'%',background:S.green,borderRadius:2}}/>
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:S.muted,fontWeight:600,fontFamily:'DM Sans, sans-serif',marginBottom:8}}>LAST 8 MATCHES</div>
                  <div style={{display:'flex',gap:4,alignItems:'flex-end',height:50}}>
                    {p.form.map((r,i)=>{
                      const h=((r-6)/3)*100
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <div style={{width:'100%',height:h+'%',background:r>=7.5?S.green:'#444',borderRadius:'2px 2px 0 0',minHeight:4,transition:'height 0.3s'}}/>
                          <span style={{fontSize:9,color:S.muted}}>{r}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <button onClick={()=>handleScout(p)} disabled={scoutLoading[p.id]} style={{width:'100%',padding:'10px',borderRadius:8,background:'rgba(29,185,84,0.1)',border:'1px solid '+S.green,color:S.green,fontWeight:700,fontSize:14,fontFamily:'DM Sans, sans-serif'}}>
                  {scoutLoading[p.id]?'Generating Scout Report...':'&#9889; AI Scout Report'}
                </button>
                {scouts[p.id]&&(
                  <div style={{marginTop:10,padding:12,background:'#0e0e0e',borderRadius:8,borderLeft:'3px solid '+S.green,fontSize:13,color:S.text,lineHeight:1.6,fontFamily:'DM Sans, sans-serif'}}>{scouts[p.id]}</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── MORE TAB ──────────────────────────────────────────────── */
function MoreTab() {
  const [section, setSection] = useState(null)
  const [league, setLeague] = useState('PL')
  const [transferTab, setTransferTab] = useState('Confirmed')
  const [predictions, setPredictions] = useState(PREDICTIONS_FIXTURES.map(f=>({...f,pick:null,hs:'',as:'',locked:false})))
  const [userXP] = useState(1240)
  const [settings, setSettings] = useState({
    pushNotifs:true,goalAlerts:true,transferAlerts:false,matchReminders:true,showXG:true,compactFeed:false
  })
  const [favTeams, setFavTeams] = useState(['Arsenal','Liverpool','Barcelona'])
  const [addTeamInput, setAddTeamInput] = useState('')

  const menuItems = [
    {id:'standings', icon:'🏆', label:'League Standings', sub:'PL, La Liga, Bundesliga...'},
    {id:'transfers', icon:'💸', label:'Transfers', sub:'Confirmed deals & rumours'},
    {id:'predictions', icon:'🎯', label:'Match Predictions', sub:'Earn XP for correct picks'},
    {id:'badges', icon:'🎖️', label:'Badges & Achievements', sub:'Level 4 · 1240 XP'},
    {id:'settings', icon:'⚙️', label:'Settings', sub:'Notifications, preferences...'},
  ]

  const setPick = (id, pick) => setPredictions(ps=>ps.map(p=>p.id===id&&!p.locked?{...p,pick}:p))
  const setScore = (id, field, val) => setPredictions(ps=>ps.map(p=>p.id===id&&!p.locked?{...p,[field]:val}:p))
  const lockPrediction = (id) => setPredictions(ps=>ps.map(p=>p.id===id&&p.pick?{...p,locked:true}:p))

  const formDot = (r) => ({W:'#1DB954',D:'#666',L:'#ef4444'}[r]||'#333')

  const standingsData = STANDINGS[league] || STANDINGS.PL

  if(section) return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:'1px solid '+S.border,background:S.card,position:'sticky',top:0,zIndex:10}}>
        <button onClick={()=>setSection(null)} style={{color:S.text,fontSize:20,padding:4}}>&#8592;</button>
        <span style={{fontFamily:'Bebas Neue',fontSize:20,color:S.text,letterSpacing:1}}>{menuItems.find(m=>m.id===section)?.label}</span>
      </div>

      {section==='standings'&&(
        <div>
          <div style={{display:'flex',gap:8,padding:'12px 16px',overflowX:'auto',borderBottom:'1px solid '+S.border}}>
            {['PL','LaLiga'].map(l=><Pill key={l} active={league===l} onClick={()=>setLeague(l)}>{l==='LaLiga'?'La Liga':l}</Pill>)}
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'DM Sans, sans-serif',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'1px solid '+S.border}}>
                  {['Pos','Club','P','W','D','L','GD','Pts','Form'].map(h=>(
                    <th key={h} style={{padding:'8px 6px',color:S.muted,fontWeight:600,textAlign:h==='Club'?'left':'center'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standingsData.map(row=>{
                  const spotColor = row.pos<=4?S.green:row.pos<=6?'#3b82f6':row.rel?S.red:'transparent'
                  return (
                    <tr key={row.pos} style={{borderBottom:'1px solid #1a1a1a',borderLeft:'3px solid '+spotColor}}>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.muted}}>{row.pos}</td>
                      <td style={{padding:'10px 6px',color:S.text,fontWeight:600}}>{row.club}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.sub}}>{row.p}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.sub}}>{row.w}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.sub}}>{row.d}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.sub}}>{row.l}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:row.gd.startsWith('+')?S.green:S.red}}>{row.gd}</td>
                      <td style={{padding:'10px 6px',textAlign:'center',color:S.text,fontWeight:700}}>{row.pts}</td>
                      <td style={{padding:'10px 6px',textAlign:'center'}}>
                        <div style={{display:'flex',gap:3,justifyContent:'center'}}>
                          {row.form.map((r,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:formDot(r)}}/>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'12px 16px',display:'flex',gap:16,flexWrap:'wrap'}}>
            {[{color:S.green,label:'UCL (Top 4)'},{color:'#3b82f6',label:'Europa (5-6)'},{color:S.red,label:'Relegation'}].map(l=>(
              <div key={l.label} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:10,height:10,borderRadius:2,background:l.color}}/>
                <span style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section==='transfers'&&(
        <div>
          <div style={{padding:'10px 16px',background:'#111',borderBottom:'1px solid '+S.border,overflow:'hidden'}}>
            <div style={{fontSize:12,color:S.gold,fontFamily:'DM Sans, sans-serif',whiteSpace:'nowrap',animation:'marquee 20s linear infinite'}}>
              &#128293; BREAKING: Mbappé to Al-Hilal confirmed &#8226; Haaland linked with Real Madrid &#8226; Salah contract standoff &#8226; Bellingham signs new deal &#8226;
              <style>{`@keyframes marquee{from{transform:translateX(100%);}to{transform:translateX(-100%);}}`}</style>
            </div>
          </div>
          <div style={{display:'flex',gap:0,borderBottom:'1px solid '+S.border}}>
            {['Confirmed','Rumours'].map(t=>(
              <button key={t} onClick={()=>setTransferTab(t)} style={{flex:1,padding:'12px',fontWeight:700,fontSize:14,fontFamily:'DM Sans, sans-serif',color:transferTab===t?S.green:S.muted,borderBottom:`2px solid ${transferTab===t?S.green:'transparent'}`,background:'transparent',transition:'all 0.2s'}}>{t}</button>
            ))}
          </div>
          <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
            {transferTab==='Confirmed'&&TRANSFERS_CONFIRMED.map(t=>(
              <div key={t.id} style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+S.border}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:16,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{t.player}</span>
                  <div style={{display:'flex',gap:6}}>
                    {t.hot&&<span style={{background:S.red,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10}}>&#128293; HOT</span>}
                    <span style={{background:'rgba(29,185,84,0.15)',color:S.green,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:10,border:'1px solid rgba(29,185,84,0.3)'}}>{t.fee}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:S.sub,fontFamily:'DM Sans, sans-serif'}}>
                  <span>{t.from}</span>
                  <span style={{color:S.green,fontWeight:700}}>&#8594;</span>
                  <span style={{color:S.text,fontWeight:600}}>{t.to}</span>
                  <span style={{marginLeft:'auto',color:S.muted,fontSize:12}}>{t.date}</span>
                </div>
              </div>
            ))}
            {transferTab==='Rumours'&&TRANSFERS_RUMOURS.map(t=>(
              <div key={t.id} style={{background:S.card,borderRadius:12,padding:14,border:'2px dashed '+S.border}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:16,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{t.player}</span>
                  <div style={{display:'flex',gap:1}}>
                    {'&#11088;'.repeat(4).split('&#11088;').map((_,i)=>(
                      <span key={i} style={{fontSize:12,opacity:i<t.stars?1:0.3}}>&#11088;</span>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:S.sub,fontFamily:'DM Sans, sans-serif',marginBottom:8}}>
                  <span>{t.from}</span>
                  <span style={{color:S.muted,fontWeight:700}}>&#8594;</span>
                  <span style={{color:S.text,fontWeight:600}}>{t.to}</span>
                  <span style={{marginLeft:'auto',color:S.gold,fontWeight:600}}>~{t.fee}</span>
                </div>
                <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>Source: {t.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section==='predictions'&&(
        <div style={{padding:16}}>
          <div style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+S.border,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontFamily:'Bebas Neue',fontSize:20,color:S.gold,letterSpacing:1}}>PREDICT & WIN XP</div>
              <div style={{fontSize:13,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>Your XP: <span style={{color:S.green,fontWeight:700}}>{userXP.toLocaleString()}</span></div>
            </div>
            <div style={{fontFamily:'Bebas Neue',fontSize:32,color:S.green}}>{userXP}</div>
          </div>
          {predictions.map(p=>(
            <div key={p.id} style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+S.border,marginBottom:12,opacity:p.locked?0.85:1}}>
              <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:6}}>{p.comp} &bull; {p.date}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{p.home}</span>
                <span style={{color:S.muted,fontSize:14}}>vs</span>
                <span style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{p.away}</span>
              </div>
              <div style={{display:'flex',gap:6,marginBottom:12}}>
                {[p.home+' Win','Draw',p.away+' Win'].map((label,i)=>{
                  const val=['home','draw','away'][i]
                  return (
                    <button key={i} onClick={()=>!p.locked&&setPick(p.id,val)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:'1px solid '+(p.pick===val?S.green:S.border),background:p.pick===val?'rgba(29,185,84,0.15)':'transparent',color:p.pick===val?S.green:S.sub,fontSize:11,fontWeight:p.pick===val?700:400,fontFamily:'DM Sans, sans-serif',transition:'all 0.15s'}}>
                      {label}
                    </button>
                  )
                })}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input value={p.hs} onChange={e=>setScore(p.id,'hs',e.target.value)} placeholder="0" maxLength={2} style={{width:48,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px',color:S.text,fontFamily:'Bebas Neue',fontSize:20,textAlign:'center'}}/>
                <span style={{color:S.muted,fontFamily:'Bebas Neue',fontSize:16}}>:</span>
                <input value={p.as} onChange={e=>setScore(p.id,'as',e.target.value)} placeholder="0" maxLength={2} style={{width:48,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px',color:S.text,fontFamily:'Bebas Neue',fontSize:20,textAlign:'center'}}/>
                <button onClick={()=>lockPrediction(p.id)} disabled={p.locked||!p.pick} style={{flex:1,padding:'9px',borderRadius:8,background:p.locked?'#1a1a1a':S.green,color:p.locked?S.muted:S.bg,fontWeight:700,fontSize:13,fontFamily:'DM Sans, sans-serif',opacity:!p.pick&&!p.locked?0.5:1}}>
                  {p.locked?'&#10003; Predicted':'Submit Prediction'}
                </button>
              </div>
            </div>
          ))}
          <div style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+S.border,marginTop:8}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:16,color:S.text,letterSpacing:1,marginBottom:12}}>WEEKLY LEADERBOARD</div>
            {LEADERBOARD.map(l=>(
              <div key={l.rank} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <span style={{fontSize:18,width:28}}>{l.badge}</span>
                <span style={{flex:1,fontWeight:600,fontSize:14,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{l.name}</span>
                <span style={{color:S.green,fontWeight:700,fontSize:14,fontFamily:'DM Sans, sans-serif'}}>{l.pts.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section==='badges'&&(
        <div style={{padding:16}}>
          <div style={{background:S.card,borderRadius:12,padding:16,border:'1px solid '+S.border,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:18,color:S.gold,letterSpacing:1}}>&#127942; Level 4 — Senior Pro</div>
                <div style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>1240 / 2000 XP to Level 5</div>
              </div>
              <div style={{fontFamily:'Bebas Neue',fontSize:36,color:S.gold}}>4</div>
            </div>
            <div style={{height:6,background:'#1a1a1a',borderRadius:3}}>
              <div style={{height:'100%',width:'62%',background:S.gold,borderRadius:3}}/>
            </div>
          </div>
          <div style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+S.border,marginBottom:16}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:14,color:S.text,letterSpacing:1,marginBottom:10}}>DAILY STREAK</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:24}}>&#128293;</span>
              <span style={{fontWeight:700,fontSize:16,color:S.text,fontFamily:'DM Sans, sans-serif'}}>Day 4 streak</span>
            </div>
            <div style={{display:'flex',gap:6}}>
              {['M','T','W','T','F','S','S'].map((d,i)=>(
                <div key={i} style={{flex:1,textAlign:'center'}}>
                  <div style={{width:'100%',paddingBottom:'100%',position:'relative'}}>
                    <div style={{position:'absolute',inset:0,borderRadius:'50%',background:i<4?S.green:'#1a1a1a',border:'1px solid '+(i<4?S.green:S.border),display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {i<4&&<span style={{color:S.bg,fontSize:12}}>&#10003;</span>}
                    </div>
                  </div>
                  <div style={{fontSize:10,color:S.muted,marginTop:4,fontFamily:'DM Sans, sans-serif'}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontFamily:'Bebas Neue',fontSize:14,color:S.muted,letterSpacing:1,marginBottom:10}}>YOUR BADGES</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {BADGES_DATA.map(b=>(
              <div key={b.id} className={b.earned?'badge-pop':''} style={{background:S.card,borderRadius:12,padding:14,border:'1px solid '+(b.earned?S.green:S.border),opacity:b.earned?1:0.5,textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:6}}>{b.earned?b.icon:'&#128274;'}</div>
                <div style={{fontWeight:700,fontSize:13,color:b.earned?S.text:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:4}}>{b.name}</div>
                <div style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif',lineHeight:1.4}}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section==='settings'&&(
        <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:S.card,borderRadius:12,padding:16,border:'1px solid '+S.border,display:'flex',alignItems:'center',gap:14,marginBottom:4}}>
            <Av name={CURRENT_USER.name} color={CURRENT_USER.color} size={56}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:17,color:S.text,fontFamily:'DM Sans, sans-serif'}}>You</div>
              <div style={{fontSize:13,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>@you</div>
            </div>
            <button style={{padding:'8px 16px',borderRadius:8,border:'1px solid '+S.border,color:S.text,fontSize:13,fontWeight:600,fontFamily:'DM Sans, sans-serif'}}>Edit Profile</button>
          </div>

          <div style={{background:S.card,borderRadius:12,border:'1px solid '+S.border,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',fontSize:11,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',borderBottom:'1px solid '+S.border}}>NOTIFICATIONS</div>
            {[
              {key:'pushNotifs',label:'Push Notifications',icon:'&#128276;'},
              {key:'goalAlerts',label:'Goal Alerts',icon:'&#9917;'},
              {key:'transferAlerts',label:'Transfer Alerts',icon:'&#128176;'},
              {key:'matchReminders',label:'Match Reminders',icon:'&#9200;'},
            ].map(s=>(
              <div key={s.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid '+S.border}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:18}}>{decodeEntity(s.icon)}</span>
                  <span style={{fontSize:14,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{s.label}</span>
                </div>
                <Toggle checked={settings[s.key]} onChange={v=>setSettings(st=>({...st,[s.key]:v}))}/>
              </div>
            ))}
          </div>

          <div style={{background:S.card,borderRadius:12,border:'1px solid '+S.border,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',fontSize:11,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',borderBottom:'1px solid '+S.border}}>FEED PREFERENCES</div>
            {[
              {key:'showXG',label:'Show xG Stats',icon:'&#128202;'},
              {key:'compactFeed',label:'Compact Feed',icon:'&#9741;'},
            ].map(s=>(
              <div key={s.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid '+S.border}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:18}}>{decodeEntity(s.icon)}</span>
                  <span style={{fontSize:14,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{s.label}</span>
                </div>
                <Toggle checked={settings[s.key]} onChange={v=>setSettings(st=>({...st,[s.key]:v}))}/>
              </div>
            ))}
          </div>

          <div style={{background:S.card,borderRadius:12,border:'1px solid '+S.border,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',fontSize:11,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',borderBottom:'1px solid '+S.border}}>FAVOURITE TEAMS</div>
            <div style={{padding:14,display:'flex',flexWrap:'wrap',gap:8}}>
              {favTeams.map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:6,background:'#1a1a1a',borderRadius:20,padding:'6px 12px',border:'1px solid '+S.border}}>
                  <span style={{fontSize:13,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{t}</span>
                  <button onClick={()=>setFavTeams(ts=>ts.filter(x=>x!==t))} style={{color:S.muted,fontSize:16,lineHeight:1}}>&#215;</button>
                </div>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input value={addTeamInput} onChange={e=>setAddTeamInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&addTeamInput.trim()){setFavTeams(ts=>[...ts,addTeamInput.trim()]);setAddTeamInput('')}}} placeholder="+ Add Team" style={{background:'#1a1a1a',border:'1px dashed '+S.border,borderRadius:20,padding:'6px 12px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:13,width:100}}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="tab-in" style={{paddingBottom:80}}>
      <div style={{padding:'20px 16px 8px'}}>
        <div style={{fontFamily:'Bebas Neue',fontSize:28,color:S.text,letterSpacing:1.5,marginBottom:4}}>MORE</div>
        <div style={{fontSize:13,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>Standings, transfers, predictions & more</div>
      </div>
      <div style={{padding:'8px 16px',display:'flex',flexDirection:'column',gap:8}}>
        {menuItems.map(item=>(
          <button key={item.id} onClick={()=>setSection(item.id)} style={{display:'flex',alignItems:'center',gap:14,background:S.card,borderRadius:12,padding:'16px',border:'1px solid '+S.border,textAlign:'left',width:'100%'}}>
            <span style={{fontSize:28,width:36,textAlign:'center'}}>{item.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{item.label}</div>
              <div style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif',marginTop:2}}>{item.sub}</div>
            </div>
            <span style={{color:S.muted,fontSize:18}}>&#8250;</span>
          </button>
        ))}
      </div>
    </div>
  )
}


/* ─── NOTIFICATION CENTER ───────────────────────────────────── */
function NotificationCenter({ onClose }) {
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const markAll = () => setNotifs(ns=>ns.map(n=>({...n,read:true})))
  return (
    <div className="slide-down" style={{position:'absolute',top:58,left:0,right:0,background:'#161616',border:'1px solid '+S.border,borderRadius:'0 0 16px 16px',zIndex:50,maxHeight:'70vh',overflowY:'auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid '+S.border}}>
        <span style={{fontFamily:'Bebas Neue',fontSize:18,color:S.text,letterSpacing:1}}>NOTIFICATIONS</span>
        <div style={{display:'flex',gap:10}}>
          <button onClick={markAll} style={{fontSize:12,color:S.green,fontFamily:'DM Sans, sans-serif',fontWeight:600}}>Mark all read</button>
          <button onClick={onClose} style={{color:S.muted,fontSize:20,lineHeight:1}}>&#215;</button>
        </div>
      </div>
      {notifs.map(n=>(
        <div key={n.id} onClick={()=>setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderBottom:'1px solid #1a1a1a',background:n.read?'transparent':'rgba(29,185,84,0.04)',cursor:'pointer'}}>
          <span style={{fontSize:20,flexShrink:0}}>{n.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontSize:13,color:S.text,fontFamily:'DM Sans, sans-serif',lineHeight:1.5}}>{n.text}</p>
            <p style={{fontSize:11,color:S.muted,fontFamily:'DM Sans, sans-serif',marginTop:3}}>{n.time}</p>
          </div>
          {!n.read&&<div style={{width:8,height:8,borderRadius:'50%',background:S.green,flexShrink:0,marginTop:4}}/>}
        </div>
      ))}
    </div>
  )
}

/* ─── SEARCH VIEW ───────────────────────────────────────────── */
function SearchView({ onClose }) {
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(()=>{ ref.current?.focus() },[])

  const results = q ? {
    players: PLAYERS.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())),
    posts: POSTS.filter(p=>p.text.toLowerCase().includes(q.toLowerCase())),
  } : null

  return (
    <div className="tab-in" style={{position:'absolute',inset:0,background:S.bg,zIndex:40,paddingBottom:80}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:'1px solid '+S.border,background:S.card}}>
        <button onClick={onClose} style={{color:S.text,fontSize:20,padding:4}}>&#8592;</button>
        <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search players, posts, clubs..." style={{flex:1,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:10,padding:'10px 14px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:15}}/>
      </div>
      <div style={{padding:16}}>
        {!q&&(
          <div>
            <div style={{fontSize:12,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',marginBottom:12}}>TRENDING SEARCHES</div>
            {['#UCLFinal','Haaland','Bellingham','Transfer Deadline','Mbappé','El Clasico','Lamine Yamal'].map(t=>(
              <button key={t} onClick={()=>setQ(t.replace('#',''))} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 0',borderBottom:'1px solid #1a1a1a',textAlign:'left'}}>
                <span style={{fontSize:20}}>&#128293;</span>
                <span style={{fontSize:14,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{t}</span>
                <span style={{marginLeft:'auto',fontSize:16,color:S.muted}}>&#8599;</span>
              </button>
            ))}
          </div>
        )}
        {results&&(
          <div>
            {results.players.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',marginBottom:10}}>PLAYERS</div>
                {results.players.map(p=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <Av name={p.name} color={p.color} size={40}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{p.name} {p.nat}</div>
                      <div style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>{p.club} &bull; {p.pos}</div>
                    </div>
                    <div style={{marginLeft:'auto',fontSize:20,fontWeight:800,color:S.green,fontFamily:'Bebas Neue'}}>{p.stats.goals}</div>
                  </div>
                ))}
              </div>
            )}
            {results.posts.length>0&&(
              <div>
                <div style={{fontSize:12,color:S.muted,fontWeight:600,letterSpacing:1,fontFamily:'DM Sans, sans-serif',marginBottom:10}}>POSTS</div>
                {results.posts.slice(0,4).map(p=>(
                  <div key={p.id} style={{marginBottom:12,padding:12,background:S.card,borderRadius:10,border:'1px solid '+S.border}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                      <Av name={p.user.name} color={p.user.color} size={24}/>
                      <span style={{fontSize:13,fontWeight:600,color:S.text,fontFamily:'DM Sans, sans-serif'}}>{p.user.name}</span>
                    </div>
                    <p style={{fontSize:13,color:S.sub,fontFamily:'DM Sans, sans-serif',lineHeight:1.5}}>{p.text.slice(0,100)}...</p>
                  </div>
                ))}
              </div>
            )}
            {results.players.length===0&&results.posts.length===0&&(
              <div style={{textAlign:'center',padding:40,color:S.muted,fontFamily:'DM Sans, sans-serif'}}>No results for "{q}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── SKELETON LOADER ────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <div style={{padding:16,display:'flex',flexDirection:'column',gap:16}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{display:'flex',gap:12}}>
          <div className="shimmer" style={{width:44,height:44,borderRadius:'50%',flexShrink:0}}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
            <div className="shimmer" style={{height:14,borderRadius:6,width:'60%'}}/>
            <div className="shimmer" style={{height:12,borderRadius:6,width:'90%'}}/>
            <div className="shimmer" style={{height:12,borderRadius:6,width:'75%'}}/>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function KickoffApp() {
  const [tab, setTab] = useState('feed')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [showApiInput, setShowApiInput] = useState(false)

  const unreadCount = NOTIFICATIONS.filter(n=>!n.read).length

  useEffect(()=>{
    const t = setTimeout(()=>setLoading(false), 700)
    return ()=>clearTimeout(t)
  },[])

  const TABS = [
    { id:'feed', icon:'&#127968;', label:'Feed' },
    { id:'chat', icon:'&#128172;', label:'Chat' },
    { id:'live', icon:'&#128308;', label:'Live', pulse:true },
    { id:'players', icon:'&#128100;', label:'Players' },
    { id:'more', icon:'&#9881;', label:'More' },
  ]

  return (
    <div style={{fontFamily:'DM Sans, sans-serif',background:S.bg,color:S.text,maxWidth:430,margin:'0 auto',minHeight:'100vh',position:'relative',overflow:'hidden'}}>
      <GlobalStyles/>

      {/* Top Bar */}
      <div style={{position:'sticky',top:0,zIndex:30,background:S.bg,borderBottom:'1px solid '+S.border,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',height:58}}>
        <button onClick={()=>setShowApiInput(!showApiInput)} style={{fontFamily:'Bebas Neue',fontSize:26,color:S.green,letterSpacing:2,letterSpacing:3,background:'transparent'}}>KICKOFF</button>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <button onClick={()=>{setShowSearch(true);setShowNotifs(false)}} style={{width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:S.muted,fontSize:20,background:'transparent'}}>&#128269;</button>
          <button onClick={()=>{setShowNotifs(!showNotifs);setShowSearch(false)}} style={{width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:S.muted,fontSize:20,background:'transparent',position:'relative'}}>
            &#128276;
            {unreadCount>0&&<span style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:S.red,color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* API Key input */}
      {showApiInput&&(
        <div className="slide-down" style={{position:'absolute',top:58,left:0,right:0,background:S.card,border:'1px solid '+S.border,zIndex:50,padding:16}}>
          <div style={{fontSize:12,color:S.muted,fontFamily:'DM Sans, sans-serif',marginBottom:8}}>Anthropic API Key (for AI features)</div>
          <div style={{display:'flex',gap:8}}>
            <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." style={{flex:1,background:'#0e0e0e',border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',color:S.text,fontFamily:'DM Sans, sans-serif',fontSize:13}}/>
            <button onClick={()=>setShowApiInput(false)} style={{background:S.green,color:S.bg,padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:13,fontFamily:'DM Sans, sans-serif'}}>Save</button>
          </div>
        </div>
      )}

      {/* Notification Center */}
      {showNotifs&&<NotificationCenter onClose={()=>setShowNotifs(false)}/>}

      {/* Search View */}
      {showSearch&&<SearchView onClose={()=>setShowSearch(false)}/>}

      {/* Content */}
      <div style={{overflowY:'auto',height:'calc(100vh - 118px)'}}>
        {loading ? (
          <SkeletonLoader/>
        ) : (
          <>
            {tab==='feed'&&<FeedTab apiKey={apiKey}/>}
            {tab==='chat'&&<ChatTab/>}
            {tab==='live'&&<LiveTab apiKey={apiKey}/>}
            {tab==='players'&&<PlayersTab apiKey={apiKey}/>}
            {tab==='more'&&<MoreTab/>}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,height:60,background:S.bg,borderTop:'1px solid '+S.border,display:'flex',alignItems:'stretch',zIndex:20}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'transparent',color:tab===t.id?S.green:S.muted,transition:'color 0.15s'}}>
            <div style={{position:'relative',fontSize:20,lineHeight:1}}>
              <span>{decodeEntity(t.icon)}</span>
              {t.pulse&&<span className="pulse" style={{position:'absolute',top:-2,right:-4,width:7,height:7,borderRadius:'50%',background:S.red,display:'inline-block'}}/>}
            </div>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:400,fontFamily:'DM Sans, sans-serif',letterSpacing:0.3}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
