export interface ActivePlayer {
  id: string
  name: string
  club: string
  clubColor: string
  nationality: string
  flag: string
  age: number
  position: string
  positionGroup: 'GK' | 'DEF' | 'MF' | 'FW'
  marketValue: string
  overallRating: number
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }
  seasonStats: { appearances: number; goals: number; assists: number; yellowCards: number; redCards: number; rating: number }
}

function p(
  name: string, club: string, clubColor: string, nat: string, flag: string,
  age: number, pos: string, grp: 'GK' | 'DEF' | 'MF' | 'FW', mv: string, ovr: number,
  [pac, sho, pas, dri, def, phy]: number[],
  [apps, g, a, yc, rc, rat]: number[]
): ActivePlayer {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name, club, clubColor, nationality: nat, flag, age, position: pos, positionGroup: grp,
    marketValue: mv, overallRating: ovr,
    attributes: { pace: pac, shooting: sho, passing: pas, dribbling: dri, defending: def, physical: phy },
    seasonStats: { appearances: apps, goals: g, assists: a, yellowCards: yc, redCards: rc, rating: rat },
  }
}

export const activePlayers: ActivePlayer[] = [
  // ── GOALKEEPERS ──────────────────────────────────────────────────────────
  p('Thibaut Courtois',     'Real Madrid',     '#FEBE00', 'Belgium',     '🇧🇪', 33, 'GK',  'GK',  '€50M',  91, [42,13,73,43,31,89], [32,0,0,1,0,7.4]),
  p('Alisson Becker',       'Liverpool',       '#C8102E', 'Brazil',      '🇧🇷', 33, 'GK',  'GK',  '€50M',  90, [40,15,71,42,28,85], [30,0,1,2,0,7.3]),
  p('Gianluigi Donnarumma', 'PSG',             '#003370', 'Italy',       '🇮🇹', 26, 'GK',  'GK',  '€60M',  89, [44,14,74,43,30,88], [30,0,0,2,0,7.2]),
  p('Ederson',              'Man City',        '#6CABDD', 'Brazil',      '🇧🇷', 32, 'GK',  'GK',  '€40M',  88, [62,16,85,45,30,82], [30,0,1,1,0,7.1]),
  p('Mike Maignan',         'AC Milan',        '#FB090B', 'France',      '🇫🇷', 29, 'GK',  'GK',  '€55M',  89, [68,15,72,47,32,84], [28,0,1,1,0,7.2]),
  p('Jan Oblak',            'Atletico Madrid', '#CE3524', 'Slovenia',    '🇸🇮', 32, 'GK',  'GK',  '€35M',  89, [38,14,71,42,28,82], [30,0,0,1,0,7.3]),
  p('Emiliano Martinez',    'Aston Villa',     '#670E36', 'Argentina',   '🇦🇷', 33, 'GK',  'GK',  '€35M',  87, [43,14,72,43,29,81], [30,0,0,1,0,7.1]),
  p('David Raya',           'Arsenal',         '#EF0107', 'Spain',       '🇪🇸', 30, 'GK',  'GK',  '€40M',  87, [50,13,73,44,28,78], [30,0,0,3,0,7.1]),
  p('André Onana',          'Man United',      '#DA291C', 'Cameroon',    '🇨🇲', 29, 'GK',  'GK',  '€45M',  86, [55,14,71,45,29,79], [29,0,0,2,0,6.9]),
  p('Yann Sommer',          'Inter Milan',     '#0068A8', 'Switzerland', '🇨🇭', 37, 'GK',  'GK',  '€6M',   85, [45,13,70,42,27,74], [29,0,0,1,0,7.1]),
  p('Manuel Neuer',         'Bayern Munich',   '#DC052D', 'Germany',     '🇩🇪', 40, 'GK',  'GK',  '€10M',  84, [48,17,77,46,35,75], [24,0,0,1,0,7.0]),
  p('Wojciech Szczesny',    'Barcelona',       '#A50044', 'Poland',      '🇵🇱', 35, 'GK',  'GK',  '€5M',   83, [38,12,68,40,26,76], [25,0,0,1,0,7.0]),
  p('Gregor Kobel',         'Dortmund',        '#FDE100', 'Switzerland', '🇨🇭', 28, 'GK',  'GK',  '€40M',  85, [48,13,72,44,28,76], [26,0,0,1,0,7.1]),

  // ── DEFENDERS ────────────────────────────────────────────────────────────
  p('Ruben Dias',              'Man City',        '#6CABDD', 'Portugal',    '🇵🇹', 28, 'CB',  'DEF', '€80M',  90, [72,40,79,68,92,85], [29,1,2,3,0,7.5]),
  p('Virgil van Dijk',         'Liverpool',       '#C8102E', 'Netherlands', '🇳🇱', 34, 'CB',  'DEF', '€45M',  89, [73,41,73,66,91,91], [30,3,2,4,0,7.5]),
  p('William Saliba',          'Arsenal',         '#EF0107', 'France',      '🇫🇷', 24, 'CB',  'DEF', '€100M', 88, [76,38,78,70,89,82], [31,1,2,2,0,7.6]),
  p('Trent Alexander-Arnold',  'Real Madrid',     '#FEBE00', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 27, 'RB',  'DEF', '€90M',  88, [79,74,89,79,69,72], [28,4,12,3,0,7.7]),
  p('Alessandro Bastoni',      'Inter Milan',     '#0068A8', 'Italy',       '🇮🇹', 26, 'CB',  'DEF', '€80M',  87, [75,40,83,73,87,82], [30,2,3,3,0,7.5]),
  p('Gabriel Magalhaes',       'Arsenal',         '#EF0107', 'Brazil',      '🇧🇷', 28, 'CB',  'DEF', '€70M',  87, [69,45,75,65,88,88], [30,3,1,5,0,7.4]),
  p('Achraf Hakimi',           'PSG',             '#003370', 'Morocco',     '🇲🇦', 27, 'RB',  'DEF', '€70M',  87, [95,70,76,82,72,78], [26,4,8,4,0,7.4]),
  p('Reece James',             'Chelsea',         '#034694', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 26, 'RB',  'DEF', '€65M',  87, [82,68,82,78,83,78], [22,2,5,3,0,7.4]),
  p('Jules Kounde',            'Barcelona',       '#004D98', 'France',      '🇫🇷', 27, 'RB',  'DEF', '€65M',  86, [82,60,80,75,83,76], [28,2,4,3,0,7.3]),
  p('Theo Hernandez',          'AC Milan',        '#FB090B', 'France',      '🇫🇷', 28, 'LB',  'DEF', '€65M',  86, [90,72,76,81,72,80], [27,5,7,6,1,7.3]),
  p('Alejandro Grimaldo',      'Leverkusen',      '#E32221', 'Spain',       '🇪🇸', 30, 'LB',  'DEF', '€40M',  86, [88,68,80,78,72,72], [27,5,9,3,0,7.5]),
  p('Marquinhos',              'PSG',             '#003370', 'Brazil',      '🇧🇷', 31, 'CB',  'DEF', '€45M',  86, [72,38,76,70,88,80], [25,1,1,2,0,7.2]),
  p('Dani Carvajal',           'Real Madrid',     '#FEBE00', 'Spain',       '🇪🇸', 33, 'RB',  'DEF', '€30M',  86, [78,60,79,73,82,76], [26,2,5,3,0,7.3]),
  p('Alphonso Davies',         'Bayern Munich',   '#DC052D', 'Canada',      '🇨🇦', 25, 'LB',  'DEF', '€70M',  86, [97,60,77,85,70,75], [25,2,6,3,0,7.2]),
  p('Kim Min-jae',             'Bayern Munich',   '#DC052D', 'South Korea', '🇰🇷', 29, 'CB',  'DEF', '€65M',  87, [74,42,76,67,88,88], [28,1,1,3,0,7.3]),
  p('Ronald Araujo',           'Barcelona',       '#004D98', 'Uruguay',     '🇺🇾', 26, 'CB',  'DEF', '€70M',  86, [80,48,72,70,88,88], [20,1,1,3,0,7.2]),
  p('Andrew Robertson',        'Liverpool',       '#C8102E', 'Scotland',    '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 32, 'LB',  'DEF', '€30M',  84, [85,60,78,72,75,76], [27,1,7,3,0,7.2]),
  p('Ben White',               'Arsenal',         '#EF0107', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 28, 'RB',  'DEF', '€55M',  84, [78,55,80,72,80,72], [29,1,4,2,0,7.3]),
  p('Antonio Rudiger',         'Real Madrid',     '#FEBE00', 'Germany',     '🇩🇪', 32, 'CB',  'DEF', '€25M',  84, [78,42,70,68,87,90], [25,1,1,4,0,7.0]),
  p('Dayot Upamecano',         'Bayern Munich',   '#DC052D', 'France',      '🇫🇷', 27, 'CB',  'DEF', '€55M',  84, [76,38,75,68,85,83], [27,1,1,5,1,7.0]),
  p('Jonathan Tah',            'Leverkusen',      '#E32221', 'Germany',     '🇩🇪', 29, 'CB',  'DEF', '€45M',  85, [72,40,78,68,87,85], [26,2,2,4,0,7.2]),
  p('Nahuel Molina',           'Atletico Madrid', '#CE3524', 'Argentina',   '🇦🇷', 27, 'RB',  'DEF', '€35M',  83, [83,58,72,72,76,72], [26,2,4,3,0,7.1]),
  p('Jose Gimenez',            'Atletico Madrid', '#CE3524', 'Uruguay',     '🇺🇾', 30, 'CB',  'DEF', '€35M',  85, [72,40,72,65,86,85], [25,1,1,3,0,7.2]),
  p('Bruno Guimaraes',         'Newcastle',       '#241F20', 'Brazil',      '🇧🇷', 28, 'CM',  'MF',  '€80M',  87, [72,72,85,80,76,78], [27,6,10,5,0,7.8]),
  p('Joao Cancelo',            'Barcelona',       '#004D98', 'Portugal',    '🇵🇹', 31, 'RB',  'DEF', '€35M',  84, [88,65,82,82,74,72], [24,2,5,3,0,7.2]),

  // ── MIDFIELDERS ──────────────────────────────────────────────────────────
  p('Jude Bellingham',      'Real Madrid',     '#FEBE00', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 22, 'CAM', 'MF',  '€180M', 92, [78,83,84,87,70,85], [30,18,10,4,0,8.3]),
  p('Rodri',                'Man City',        '#6CABDD', 'Spain',       '🇪🇸', 30, 'CDM', 'MF',  '€150M', 91, [62,68,88,80,88,83], [28,5,8,5,0,8.1]),
  p('Florian Wirtz',        'Leverkusen',      '#E32221', 'Germany',     '🇩🇪', 22, 'CAM', 'MF',  '€180M', 91, [83,82,87,92,55,68], [28,16,14,2,0,8.3]),
  p('Jamal Musiala',        'Bayern Munich',   '#DC052D', 'Germany',     '🇩🇪', 22, 'CAM', 'MF',  '€180M', 91, [87,82,85,93,55,72], [28,18,12,2,0,8.4]),
  p('Kevin De Bruyne',      'Man City',        '#6CABDD', 'Belgium',     '🇧🇪', 35, 'CM',  'MF',  '€60M',  90, [74,86,94,87,64,78], [22,8,14,3,0,8.2]),
  p('Martin Odegaard',      'Arsenal',         '#EF0107', 'Norway',      '🇳🇴', 27, 'CAM', 'MF',  '€100M', 90, [71,78,91,87,62,65], [20,6,8,2,0,7.9]),
  p('Declan Rice',          'Arsenal',         '#EF0107', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 27, 'CDM', 'MF',  '€100M', 90, [72,70,84,78,86,83], [31,7,8,5,0,7.9]),
  p('Federico Valverde',    'Real Madrid',     '#FEBE00', 'Uruguay',     '🇺🇾', 27, 'CM',  'MF',  '€130M', 89, [88,78,85,84,72,85], [30,8,9,4,0,8.0]),
  p('Bernardo Silva',       'Man City',        '#6CABDD', 'Portugal',    '🇵🇹', 31, 'CM',  'MF',  '€70M',  88, [76,75,88,89,65,72], [30,8,11,2,0,8.0]),
  p('Nicolo Barella',       'Inter Milan',     '#0068A8', 'Italy',       '🇮🇹', 28, 'CM',  'MF',  '€80M',  88, [78,74,86,83,73,82], [30,7,11,6,0,7.9]),
  p('Pedri',                'Barcelona',       '#004D98', 'Spain',       '🇪🇸', 23, 'CM',  'MF',  '€100M', 88, [76,72,87,89,68,68], [26,6,9,3,0,8.0]),
  p('Joshua Kimmich',       'Bayern Munich',   '#DC052D', 'Germany',     '🇩🇪', 30, 'CDM', 'MF',  '€70M',  89, [71,72,90,82,82,75], [30,4,12,5,1,7.9]),
  p('Bruno Fernandes',      'Man United',      '#DA291C', 'Portugal',    '🇵🇹', 31, 'CAM', 'MF',  '€65M',  87, [73,82,86,83,58,72], [30,12,13,5,0,7.8]),
  p('Phil Foden',           'Man City',        '#6CABDD', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 26, 'LW',  'MF',  '€150M', 91, [87,82,86,91,50,70], [27,14,12,2,0,8.1]),
  p('Luka Modric',          'Real Madrid',     '#FEBE00', 'Croatia',     '🇭🇷', 40, 'CM',  'MF',  '€8M',   86, [72,74,90,87,63,61], [26,4,9,2,0,7.8]),
  p('Hakan Calhanoglu',     'Inter Milan',     '#0068A8', 'Turkey',      '🇹🇷', 31, 'CDM', 'MF',  '€50M',  86, [70,76,88,80,72,70], [29,8,10,4,0,7.8]),
  p('Alexis Mac Allister',  'Liverpool',       '#C8102E', 'Argentina',   '🇦🇷', 27, 'CM',  'MF',  '€80M',  86, [73,70,84,79,71,74], [28,5,8,4,0,7.6]),
  p('Warren Zaire-Emery',   'PSG',             '#003370', 'France',      '🇫🇷', 20, 'CM',  'MF',  '€90M',  85, [82,70,82,84,65,72], [26,5,7,3,0,7.5]),
  p('Gavi',                 'Barcelona',       '#004D98', 'Spain',       '🇪🇸', 21, 'CM',  'MF',  '€100M', 87, [73,64,87,86,65,72], [24,4,8,6,0,7.6]),
  p('Frenkie de Jong',      'Barcelona',       '#004D98', 'Netherlands', '🇳🇱', 28, 'CM',  'MF',  '€65M',  87, [74,64,88,84,69,72], [22,3,6,2,0,7.6]),
  p('Tijjani Reijnders',    'AC Milan',        '#FB090B', 'Netherlands', '🇳🇱', 27, 'CM',  'MF',  '€55M',  85, [78,72,83,81,68,72], [28,7,8,3,0,7.6]),
  p('Dominik Szoboszlai',   'Liverpool',       '#C8102E', 'Hungary',     '🇭🇺', 24, 'CAM', 'MF',  '€65M',  83, [78,72,82,80,60,72], [27,5,7,4,0,7.3]),
  p('Enzo Fernandez',       'Chelsea',         '#034694', 'Argentina',   '🇦🇷', 25, 'CM',  'MF',  '€80M',  86, [74,72,84,80,72,72], [28,5,8,4,0,7.4]),
  p('Moises Caicedo',       'Chelsea',         '#034694', 'Ecuador',     '🇪🇨', 24, 'CDM', 'MF',  '€90M',  86, [75,64,78,76,83,78], [29,2,4,6,0,7.3]),
  p('Kobbie Mainoo',        'Man United',      '#DA291C', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 21, 'CM',  'MF',  '€80M',  85, [74,68,82,82,70,72], [28,4,6,3,0,7.4]),
  p('James Maddison',       'Tottenham',       '#132257', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 29, 'CAM', 'MF',  '€60M',  84, [72,76,85,82,54,65], [25,7,9,3,0,7.4]),
  p('Dejan Kulusevski',     'Tottenham',       '#132257', 'Sweden',      '🇸🇪', 25, 'CM',  'MF',  '€55M',  84, [82,72,80,80,60,72], [26,7,8,2,0,7.5]),
  p('Granit Xhaka',         'Leverkusen',      '#E32221', 'Switzerland', '🇨🇭', 33, 'CDM', 'MF',  '€20M',  84, [65,68,84,74,80,72], [26,4,9,5,1,7.4]),
  p('Fabian Ruiz',          'PSG',             '#003370', 'Spain',       '🇪🇸', 29, 'CM',  'MF',  '€40M',  84, [72,74,86,78,62,70], [24,5,8,2,0,7.4]),
  p('Rodrigo De Paul',      'Atletico Madrid', '#CE3524', 'Argentina',   '🇦🇷', 31, 'CM',  'MF',  '€35M',  83, [78,68,80,78,68,76], [26,4,7,5,0,7.3]),
  p('Conor Gallagher',      'Atletico Madrid', '#CE3524', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 25, 'CM',  'MF',  '€50M',  82, [80,64,76,75,72,82], [27,4,5,5,0,7.2]),
  p('Mikel Merino',         'Arsenal',         '#EF0107', 'Spain',       '🇪🇸', 29, 'CM',  'MF',  '€40M',  84, [68,68,82,75,74,78], [26,4,6,3,0,7.4]),
  p('Ilkay Gundogan',       'Barcelona',       '#004D98', 'Germany',     '🇩🇪', 34, 'CM',  'MF',  '€10M',  84, [64,72,88,78,65,68], [22,4,7,2,0,7.4]),
  p('Joao Palhinha',        'Bayern Munich',   '#DC052D', 'Portugal',    '🇵🇹', 30, 'CDM', 'MF',  '€50M',  85, [66,62,76,68,87,84], [26,1,2,8,1,7.2]),
  p('Youri Tielemans',      'Aston Villa',     '#670E36', 'Belgium',     '🇧🇪', 28, 'CM',  'MF',  '€35M',  83, [72,68,84,76,66,70], [26,5,7,3,0,7.3]),

  // ── FORWARDS ─────────────────────────────────────────────────────────────
  p('Kylian Mbappe',        'Real Madrid',     '#FEBE00', 'France',      '🇫🇷', 27, 'LW',  'FW',  '€220M', 93, [97,91,82,93,36,78], [29,26,9,2,0,8.5]),
  p('Erling Haaland',       'Man City',        '#6CABDD', 'Norway',      '🇳🇴', 25, 'ST',  'FW',  '€200M', 92, [89,95,65,80,45,88], [30,28,7,3,0,8.6]),
  p('Vinicius Jr',          'Real Madrid',     '#FEBE00', 'Brazil',      '🇧🇷', 25, 'LW',  'FW',  '€200M', 92, [95,84,78,93,32,72], [28,22,13,4,1,8.4]),
  p('Lionel Messi',         'Inter Miami',     '#F7B5CD', 'Argentina',   '🇦🇷', 38, 'CF',  'FW',  '€30M',  91, [72,88,91,93,32,61], [16,10,14,1,0,8.1]),
  p('Mohamed Salah',        'Liverpool',       '#C8102E', 'Egypt',       '🇪🇬', 33, 'RW',  'FW',  '€60M',  90, [91,87,78,87,45,74], [29,22,12,2,0,8.4]),
  p('Harry Kane',           'Bayern Munich',   '#DC052D', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 33, 'ST',  'FW',  '€80M',  90, [72,94,85,79,43,82], [28,25,10,2,0,8.4]),
  p('Bukayo Saka',          'Arsenal',         '#EF0107', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 24, 'RW',  'FW',  '€150M', 90, [86,82,84,87,50,72], [28,16,14,3,0,8.2]),
  p('Lamine Yamal',         'Barcelona',       '#004D98', 'Spain',       '🇪🇸', 18, 'RW',  'FW',  '€200M', 89, [90,82,83,91,35,62], [28,16,12,2,0,8.2]),
  p('Cole Palmer',          'Chelsea',         '#034694', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 23, 'CAM', 'FW',  '€120M', 89, [80,87,84,89,45,68], [29,18,12,2,0,8.2]),
  p('Lautaro Martinez',     'Inter Milan',     '#0068A8', 'Argentina',   '🇦🇷', 28, 'ST',  'FW',  '€110M', 90, [82,89,72,86,44,82], [29,22,8,4,0,8.3]),
  p('Julian Alvarez',       'Atletico Madrid', '#CE3524', 'Argentina',   '🇦🇷', 25, 'ST',  'FW',  '€120M', 88, [82,86,76,83,46,78], [29,18,9,3,0,8.1]),
  p('Cristiano Ronaldo',    'Al Nassr',        '#C8A84B', 'Portugal',    '🇵🇹', 41, 'ST',  'FW',  '€15M',  86, [77,92,78,80,33,80], [25,22,5,3,0,7.8]),
  p('Raphinha',             'Barcelona',       '#004D98', 'Brazil',      '🇧🇷', 28, 'RW',  'FW',  '€65M',  87, [88,82,78,85,40,72], [28,16,12,3,0,8.0]),
  p('Rafael Leao',          'AC Milan',        '#FB090B', 'Portugal',    '🇵🇹', 26, 'LW',  'FW',  '€90M',  88, [94,80,74,90,32,74], [27,15,10,3,0,7.9]),
  p('Rodrygo',              'Real Madrid',     '#FEBE00', 'Brazil',      '🇧🇷', 24, 'RW',  'FW',  '€120M', 86, [86,80,78,85,42,68], [27,12,10,2,0,7.8]),
  p('Son Heung-min',        'Tottenham',       '#132257', 'South Korea', '🇰🇷', 33, 'LW',  'FW',  '€30M',  86, [90,85,77,85,42,72], [27,15,8,2,0,7.9]),
  p('Alexander Isak',       'Newcastle',       '#241F20', 'Sweden',      '🇸🇪', 26, 'ST',  'FW',  '€90M',  87, [87,87,72,84,38,76], [26,18,7,2,0,8.0]),
  p('Nico Williams',        'Athletic Bilbao', '#EE2523', 'Spain',       '🇪🇸', 22, 'LW',  'FW',  '€100M', 86, [94,78,78,90,36,70], [26,12,10,3,0,7.8]),
  p('Victor Osimhen',       'Galatasaray',     '#FF6000', 'Nigeria',     '🇳🇬', 27, 'ST',  'FW',  '€80M',  88, [91,86,68,84,34,84], [22,18,5,3,0,8.1]),
  p('Antoine Griezmann',    'Atletico Madrid', '#CE3524', 'France',      '🇫🇷', 35, 'CF',  'FW',  '€20M',  86, [78,84,81,86,56,74], [26,14,8,3,0,7.8]),
  p('Robert Lewandowski',   'Barcelona',       '#004D98', 'Poland',      '🇵🇱', 37, 'ST',  'FW',  '€15M',  87, [72,91,74,77,43,82], [25,18,6,2,0,7.9]),
  p('Khvicha Kvaratskhelia','PSG',             '#003370', 'Georgia',     '🇬🇪', 24, 'LW',  'FW',  '€100M', 88, [90,80,78,90,36,72], [25,12,11,3,0,8.0]),
  p('Ousmane Dembele',      'PSG',             '#003370', 'France',      '🇫🇷', 28, 'RW',  'FW',  '€70M',  86, [95,76,74,88,38,72], [25,10,12,4,0,7.7]),
  p('Gabriel Martinelli',   'Arsenal',         '#EF0107', 'Brazil',      '🇧🇷', 24, 'LW',  'FW',  '€80M',  84, [91,78,72,85,38,75], [27,12,7,2,0,7.6]),
  p('Kai Havertz',          'Arsenal',         '#EF0107', 'Germany',     '🇩🇪', 26, 'ST',  'FW',  '€70M',  85, [78,82,76,80,52,78], [29,14,8,2,0,7.7]),
  p('Ollie Watkins',        'Aston Villa',     '#670E36', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 30, 'ST',  'FW',  '€60M',  85, [86,84,72,80,38,78], [27,16,8,2,0,7.8]),
  p('Dusan Vlahovic',       'Juventus',        '#000000', 'Serbia',      '🇷🇸', 26, 'ST',  'FW',  '€75M',  85, [78,88,68,78,35,82], [25,15,4,3,0,7.5]),
  p('Romelu Lukaku',        'Napoli',          '#12A0C7', 'Belgium',     '🇧🇪', 32, 'ST',  'FW',  '€25M',  83, [78,84,64,76,34,91], [24,14,5,2,0,7.3]),
  p('Darwin Nunez',         'Liverpool',       '#C8102E', 'Uruguay',     '🇺🇾', 26, 'ST',  'FW',  '€65M',  84, [92,82,66,80,38,82], [25,12,6,2,0,7.4]),
  p('Cody Gakpo',           'Liverpool',       '#C8102E', 'Netherlands', '🇳🇱', 26, 'LW',  'FW',  '€60M',  84, [88,80,74,82,40,74], [26,12,7,2,0,7.5]),
  p('Diogo Jota',           'Liverpool',       '#C8102E', 'Portugal',    '🇵🇹', 28, 'ST',  'FW',  '€55M',  84, [84,84,72,82,38,74], [22,12,5,2,0,7.5]),
  p('Marcus Thuram',        'Inter Milan',     '#0068A8', 'France',      '🇫🇷', 27, 'ST',  'FW',  '€65M',  86, [88,82,70,82,42,84], [27,14,8,3,0,7.7]),
  p('Paulo Dybala',         'Roma',            '#8B1E0C', 'Argentina',   '🇦🇷', 32, 'CF',  'FW',  '€15M',  83, [78,84,80,86,40,64], [20,10,6,2,0,7.5]),
  p('Neymar Jr',            'Al Hilal',        '#1F489C', 'Brazil',      '🇧🇷', 34, 'LW',  'FW',  '€20M',  85, [88,85,83,93,28,63], [8,5,4,1,0,7.2]),
  p('Nicolas Jackson',      'Chelsea',         '#034694', 'Senegal',     '🇸🇳', 24, 'ST',  'FW',  '€60M',  82, [88,79,68,80,35,75], [26,14,6,5,0,7.4]),
  p('Rasmus Hojlund',       'Man United',      '#DA291C', 'Denmark',     '🇩🇰', 23, 'ST',  'FW',  '€60M',  82, [86,80,65,78,33,78], [24,12,4,2,0,7.3]),
  p('Alejandro Garnacho',   'Man United',      '#DA291C', 'Argentina',   '🇦🇷', 21, 'LW',  'FW',  '€70M',  82, [88,78,70,83,40,72], [28,10,7,3,0,7.5]),
  p('Marcus Rashford',      'Man United',      '#DA291C', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 28, 'LW',  'FW',  '€40M',  84, [91,80,72,83,38,72], [18,8,4,2,0,7.1]),
  p('Alvaro Morata',        'AC Milan',        '#FB090B', 'Spain',       '🇪🇸', 33, 'ST',  'FW',  '€20M',  81, [75,80,72,76,42,76], [24,11,5,3,0,7.1]),
  p('Anthony Gordon',       'Newcastle',       '#241F20', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 24, 'LW',  'FW',  '€60M',  83, [90,78,72,83,36,72], [26,10,8,3,0,7.4]),
  p('Jeremy Doku',          'Man City',        '#6CABDD', 'Belgium',     '🇧🇪', 23, 'LW',  'FW',  '€80M',  84, [97,73,74,89,32,68], [22,8,9,3,0,7.4]),
  p('Leon Bailey',          'Aston Villa',     '#670E36', 'Jamaica',     '🇯🇲', 27, 'RW',  'FW',  '€40M',  82, [92,74,72,83,34,68], [24,8,7,3,0,7.2]),
  p('Brennan Johnson',      'Tottenham',       '#132257', 'Wales',       '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 24, 'RW',  'FW',  '€55M',  82, [89,76,70,81,36,70], [24,10,6,2,0,7.3]),
  p('Karim Adeyemi',        'Dortmund',        '#FDE100', 'Germany',     '🇩🇪', 23, 'LW',  'FW',  '€55M',  83, [95,78,72,83,36,72], [23,10,7,2,0,7.4]),
  p('Victor Boniface',      'Leverkusen',      '#E32221', 'Nigeria',     '🇳🇬', 24, 'ST',  'FW',  '€55M',  84, [88,82,64,80,32,78], [22,12,6,3,0,7.5]),
  p('Kingsley Coman',       'Bayern Munich',   '#DC052D', 'France',      '🇫🇷', 29, 'LW',  'FW',  '€35M',  83, [93,76,74,84,36,70], [22,8,7,2,0,7.2]),
  p('Leroy Sane',           'Bayern Munich',   '#DC052D', 'Germany',     '🇩🇪', 29, 'RW',  'FW',  '€40M',  84, [94,77,76,86,38,70], [24,10,9,3,0,7.5]),
  p('Jack Grealish',        'Man City',        '#6CABDD', 'England',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 30, 'LW',  'FW',  '€65M',  83, [78,72,80,88,38,68], [20,5,8,2,0,7.2]),
]
