// Seed script — loads instructor test data via API
const BASE = 'http://localhost:3000/api'

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await r.json()
  if (!r.ok) throw new Error(`POST ${path} failed: ${JSON.stringify(data)}`)
  return data
}

// Location mapping from test data → DB status values
const LOC_MAP = {
  'Check-in counter': 'Checked-in',
  'Security Check':   'At security check',
  'At-the-gate':      'At gate',
  'Loaded':           'Loaded to flight'
}

const FLIGHTS = [
  { flight_id:'AA1360', airline_code:'AA', airline_name:'American Airlines',  gate:'C24', destination:'New York',         status:'waiting' },
  { flight_id:'AA3317', airline_code:'AA', airline_name:'American Airlines',  gate:'A38', destination:'Los Angeles',      status:'waiting' },
  { flight_id:'AA3290', airline_code:'AA', airline_name:'American Airlines',  gate:'A23', destination:'Miami',            status:'waiting' },
  { flight_id:'AA1476', airline_code:'AA', airline_name:'American Airlines',  gate:'D01', destination:'Orlando',          status:'boarding' },
  { flight_id:'AA1523', airline_code:'AA', airline_name:'American Airlines',  gate:'C19', destination:'Denver',           status:'boarding' },
  { flight_id:'AA1656', airline_code:'AA', airline_name:'American Airlines',  gate:'A19', destination:'Chicago',          status:'waiting' },
  { flight_id:'AA2385', airline_code:'AA', airline_name:'American Airlines',  gate:'A20', destination:'Minneapolis',      status:'waiting' },
  { flight_id:'AA1175', airline_code:'AA', airline_name:'American Airlines',  gate:'C22', destination:'San Francisco',    status:'boarding' },
  { flight_id:'DL2972', airline_code:'DL', airline_name:'Delta Airlines',     gate:'E13', destination:'Minneapolis',      status:'waiting' },
  { flight_id:'DL0839', airline_code:'DL', airline_name:'Delta Airlines',     gate:'E14', destination:'Atlanta',          status:'waiting' },
  { flight_id:'DL2746', airline_code:'DL', airline_name:'Delta Airlines',     gate:'E17', destination:'Detroit',          status:'boarding' },
  { flight_id:'DL2798', airline_code:'DL', airline_name:'Delta Airlines',     gate:'E12', destination:'Salt Lake City',   status:'waiting' },
  { flight_id:'DL0873', airline_code:'DL', airline_name:'Delta Airlines',     gate:'E11', destination:'New York',         status:'waiting' },
  { flight_id:'UA1586', airline_code:'UA', airline_name:'United Airlines',    gate:'E08', destination:'Washington D.C.',  status:'waiting' },
  { flight_id:'UA1634', airline_code:'UA', airline_name:'United Airlines',    gate:'E06', destination:'Chicago',          status:'waiting' },
  { flight_id:'UA2049', airline_code:'UA', airline_name:'United Airlines',    gate:'E09', destination:'Denver',           status:'waiting' },
  { flight_id:'UA2454', airline_code:'UA', airline_name:'United Airlines',    gate:'E05', destination:'Newark',           status:'waiting' },
  { flight_id:'FA1270', airline_code:'FA', airline_name:'Frontier Airlines',  gate:'E02', destination:'Atlanta',          status:'boarding' },
  { flight_id:'FA3330', airline_code:'FA', airline_name:'Frontier Airlines',  gate:'E04', destination:'Raleigh',          status:'waiting' },
  { flight_id:'FA2147', airline_code:'FA', airline_name:'Frontier Airlines',  gate:'E10', destination:'Denver',           status:'waiting' },
  { flight_id:'SW2209', airline_code:'SW', airline_name:'Southwest Airlines', gate:'F18', destination:'Phoenix',          status:'waiting' },
  { flight_id:'SW4326', airline_code:'SW', airline_name:'Southwest Airlines', gate:'F12', destination:'Orlando',          status:'waiting' },
  { flight_id:'SW1511', airline_code:'SW', airline_name:'Southwest Airlines', gate:'F09', destination:'Denver',           status:'waiting' },
  { flight_id:'SW1485', airline_code:'SW', airline_name:'Southwest Airlines', gate:'F11', destination:'Nashville',        status:'waiting' },
  { flight_id:'SW1823', airline_code:'SW', airline_name:'Southwest Airlines', gate:'F02', destination:'Los Angeles',      status:'waiting' },
]

const PASSENGERS = [
  { first_name:'Aram',        last_name:'Shankar',      id_number:'654231', ticket_number:'1025104332', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Malini',      last_name:'Shankar',      id_number:'653955', ticket_number:'1025181960', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Elaina',      last_name:'Peters',       id_number:'674990', ticket_number:'1025013389', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Martha',      last_name:'Washington',   id_number:'359579', ticket_number:'1025083863', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Raven',       last_name:'Clinch',       id_number:'892740', ticket_number:'1025794026', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Brian',       last_name:'Anderson',     id_number:'477001', ticket_number:'1025542351', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Lucy',        last_name:'Anderson',     id_number:'477725', ticket_number:'1025161559', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Samantha',    last_name:'Anderson',     id_number:'477911', ticket_number:'1025407816', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Raj',         last_name:'Sinha',        id_number:'725649', ticket_number:'1025184959', flight_id:'AA1523', status:'Boarded' },
  { first_name:'Ramon',       last_name:'Swaggar',      id_number:'528483', ticket_number:'1025310341', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Chris',       last_name:'Swaggar',      id_number:'520192', ticket_number:'1025316475', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Akbar',       last_name:'Mohammad',     id_number:'782094', ticket_number:'1025255341', flight_id:'AA2385', status:'Checked-in' },
  { first_name:'Ayesha',      last_name:'Mohammad',     id_number:'783331', ticket_number:'1025928327', flight_id:'AA2385', status:'Checked-in' },
  { first_name:'William',     last_name:'Dean',         id_number:'628846', ticket_number:'1025648350', flight_id:'AA1175', status:'Checked-in' },
  { first_name:'Sean',        last_name:'Oxford',       id_number:'856473', ticket_number:'1025305641', flight_id:'AA1175', status:'Boarded' },
  { first_name:'Wen',         last_name:'Hu',           id_number:'134967', ticket_number:'1025395376', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Lisa',        last_name:'Hu',           id_number:'134812', ticket_number:'1025724238', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Chao',        last_name:'Hu',           id_number:'134905', ticket_number:'1025849696', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Reeta',       last_name:'Meyer',        id_number:'367592', ticket_number:'1025532871', flight_id:'AA2385', status:'Not-checked-in' },
  { first_name:'Fu',          last_name:'Wang',         id_number:'289476', ticket_number:'1025012269', flight_id:'AA1476', status:'Checked-in' },
  { first_name:'Cliff',       last_name:'Hans',         id_number:'178944', ticket_number:'1025166978', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Graham',      last_name:'Walter',       id_number:'907467', ticket_number:'1025480184', flight_id:'AA1523', status:'Boarded' },
  { first_name:'Lisa',        last_name:'Walter',       id_number:'905173', ticket_number:'1025514627', flight_id:'AA1523', status:'Boarded' },
  { first_name:'Corey',       last_name:'Hill',         id_number:'666231', ticket_number:'1025048281', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Shawn',       last_name:'Murray',       id_number:'816733', ticket_number:'1025489325', flight_id:'AA1656', status:'Checked-in' },
  { first_name:'Alex',        last_name:'Stoopper',     id_number:'198583', ticket_number:'1025288095', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Ryan',        last_name:'Garfield',     id_number:'499282', ticket_number:'1025701543', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Melissa',     last_name:'Garfield',     id_number:'499153', ticket_number:'1025039117', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Elisa',       last_name:'Garfield',     id_number:'499006', ticket_number:'1025182278', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Vicky',       last_name:'Garfield',     id_number:'499377', ticket_number:'1025248963', flight_id:'AA3290', status:'Checked-in' },
  { first_name:'Marcus',      last_name:'Shane',        id_number:'725784', ticket_number:'1025834657', flight_id:'AA1175', status:'Checked-in' },
  { first_name:'Amanda',      last_name:'Richard',      id_number:'672668', ticket_number:'1025871331', flight_id:'AA2385', status:'Checked-in' },
  { first_name:'Charles',     last_name:'Deckon',       id_number:'726493', ticket_number:'1025509839', flight_id:'AA3290', status:'Not-checked-in' },
  { first_name:'Francis',     last_name:'Cox',          id_number:'825644', ticket_number:'1025301031', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Ruthford',    last_name:'Cox',          id_number:'825490', ticket_number:'1025051834', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Mary',        last_name:'Cox',          id_number:'825178', ticket_number:'1025738299', flight_id:'AA1476', status:'Boarded' },
  { first_name:'Sarah',       last_name:'Mullard',      id_number:'907943', ticket_number:'1025737631', flight_id:'AA1656', status:'Not-checked-in' },
  { first_name:'Ma',          last_name:'Liang',        id_number:'200194', ticket_number:'1025165667', flight_id:'AA1175', status:'Boarded' },
  { first_name:'Lou',         last_name:'Liang',        id_number:'204788', ticket_number:'1025010651', flight_id:'AA1175', status:'Boarded' },
  { first_name:'Grace',       last_name:'Liang',        id_number:'208897', ticket_number:'1025333872', flight_id:'AA1175', status:'Boarded' },
  { first_name:'Anna',        last_name:'Swanson',      id_number:'438845', ticket_number:'1025624731', flight_id:'AA1523', status:'Boarded' },
  { first_name:'Mike',        last_name:'Ruth',         id_number:'717273', ticket_number:'1025781080', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Miley',       last_name:'Ruth',         id_number:'712906', ticket_number:'1025132677', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Akalya',      last_name:'Promod',       id_number:'301486', ticket_number:'1025360260', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Arya',        last_name:'Promod',       id_number:'301857', ticket_number:'1025647468', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Laksh',       last_name:'Promod',       id_number:'301735', ticket_number:'1025723430', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Shasha',      last_name:'Brunswick',    id_number:'629453', ticket_number:'1025980500', flight_id:'AA1476', status:'Checked-in' },
  { first_name:'Delores',     last_name:'Bensen',       id_number:'103785', ticket_number:'1025978820', flight_id:'AA1476', status:'Checked-in' },
  { first_name:'Shirley',     last_name:'Albert',       id_number:'826648', ticket_number:'1025812191', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Vikram',      last_name:'Albert',       id_number:'826506', ticket_number:'1025361939', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Ravi',        last_name:'Albert',       id_number:'826005', ticket_number:'1025909169', flight_id:'AA3317', status:'Not-checked-in' },
  { first_name:'Riku',        last_name:'Suzuki',       id_number:'737493', ticket_number:'1025985435', flight_id:'AA1360', status:'Not-checked-in' },
  { first_name:'Daniel',      last_name:'Wong',         id_number:'656562', ticket_number:'1025346247', flight_id:'AA1175', status:'Checked-in' },
  { first_name:'Chris',       last_name:'Wong',         id_number:'650767', ticket_number:'1025510799', flight_id:'AA1175', status:'Checked-in' },
  { first_name:'Isabella',    last_name:'Leonardo',     id_number:'429991', ticket_number:'1025118384', flight_id:'AA2385', status:'Checked-in' },
  { first_name:'Arjun',       last_name:'Mahajan',      id_number:'295909', ticket_number:'1025251354', flight_id:'AA2385', status:'Checked-in' },
  { first_name:'Lei',         last_name:'Huang',        id_number:'639953', ticket_number:'1025278498', flight_id:'AA1175', status:'Boarded' },
  { first_name:'Rajan',       last_name:'Kishore',      id_number:'916744', ticket_number:'1025084124', flight_id:'AA1360', status:'Checked-in' },
  { first_name:'Brian',       last_name:'Goldorf',      id_number:'582664', ticket_number:'1025118244', flight_id:'AA1523', status:'Boarded' },
  { first_name:'Melene',      last_name:'Thomson',      id_number:'378596', ticket_number:'1025935348', flight_id:'AA3290', status:'Not-checked-in' },
  // Delta
  { first_name:'Joanne',      last_name:'Adams',        id_number:'667802', ticket_number:'2373740164', flight_id:'DL2972', status:'Checked-in' },
  { first_name:'Johnny',      last_name:'Adams',        id_number:'667036', ticket_number:'2373005242', flight_id:'DL2972', status:'Checked-in' },
  { first_name:'James',       last_name:'Adams',        id_number:'667132', ticket_number:'2373786801', flight_id:'DL2972', status:'Checked-in' },
  { first_name:'James',       last_name:'Williamson',   id_number:'725648', ticket_number:'2373128059', flight_id:'DL0839', status:'Not-checked-in' },
  { first_name:'Kimberly',    last_name:'Briggs',       id_number:'815848', ticket_number:'2373826204', flight_id:'DL2746', status:'Boarded' },
  { first_name:'Rapston',     last_name:'Briggs',       id_number:'815002', ticket_number:'2373505331', flight_id:'DL2746', status:'Boarded' },
  { first_name:'Clement',     last_name:'Sanderson',    id_number:'288769', ticket_number:'2373586923', flight_id:'DL0873', status:'Not-checked-in' },
  { first_name:'Laura',       last_name:'Tangen',       id_number:'936742', ticket_number:'2373226025', flight_id:'DL0873', status:'Checked-in' },
  { first_name:'Richard',     last_name:'Tangen',       id_number:'937768', ticket_number:'2373634216', flight_id:'DL0873', status:'Checked-in' },
  { first_name:'Curie',       last_name:'Tangen',       id_number:'931118', ticket_number:'2373073375', flight_id:'DL0873', status:'Checked-in' },
  { first_name:'Alisa',       last_name:'Tangen',       id_number:'930102', ticket_number:'2373433036', flight_id:'DL0873', status:'Checked-in' },
  { first_name:'Megan',       last_name:'Thompson',     id_number:'739574', ticket_number:'2373541458', flight_id:'DL2972', status:'Checked-in' },
  { first_name:'Sue',         last_name:'Hanson',       id_number:'202029', ticket_number:'2373685014', flight_id:'DL2746', status:'Boarded' },
  { first_name:'Craig',       last_name:'Lumbord',      id_number:'304586', ticket_number:'2373294019', flight_id:'DL0839', status:'Not-checked-in' },
  { first_name:'Christopher', last_name:'Walker',       id_number:'668956', ticket_number:'2373655698', flight_id:'DL0873', status:'Not-checked-in' },
  { first_name:'Kim',         last_name:'Dillon',       id_number:'896734', ticket_number:'2373169340', flight_id:'DL2972', status:'Not-checked-in' },
  { first_name:'Brandon',     last_name:'Richman',      id_number:'190285', ticket_number:'2373608835', flight_id:'DL2746', status:'Boarded' },
  { first_name:'Erica',       last_name:'Cobb',         id_number:'724546', ticket_number:'2373615951', flight_id:'DL2798', status:'Not-checked-in' },
  { first_name:'Rachel',      last_name:'Marcos',       id_number:'494022', ticket_number:'2373484656', flight_id:'DL2798', status:'Not-checked-in' },
  { first_name:'Lisbeth',     last_name:'Monroe',       id_number:'423017', ticket_number:'2373482366', flight_id:'DL2798', status:'Not-checked-in' },
  // United
  { first_name:'Jacob',       last_name:'Weiner',       id_number:'801774', ticket_number:'5784299468', flight_id:'UA1586', status:'Checked-in' },
  { first_name:'Erica',       last_name:'Sanderson',    id_number:'528473', ticket_number:'5784044369', flight_id:'UA1634', status:'Not-checked-in' },
  { first_name:'Miley',       last_name:'Sanderson',    id_number:'528092', ticket_number:'5784957773', flight_id:'UA1634', status:'Not-checked-in' },
  { first_name:'Wayne',       last_name:'Armstrong',    id_number:'825744', ticket_number:'5784872148', flight_id:'UA2049', status:'Not-checked-in' },
  { first_name:'Amira',       last_name:'Sutherland',   id_number:'712355', ticket_number:'5784951343', flight_id:'UA2454', status:'Not-checked-in' },
  { first_name:'Dana',        last_name:'Sutherland',   id_number:'712067', ticket_number:'5784320037', flight_id:'UA2454', status:'Not-checked-in' },
  { first_name:'Eric',        last_name:'Sutherland',   id_number:'712546', ticket_number:'5784917693', flight_id:'UA2454', status:'Not-checked-in' },
  { first_name:'Andy',        last_name:'Klapper',      id_number:'716767', ticket_number:'5784676320', flight_id:'UA1586', status:'Checked-in' },
  { first_name:'Mark',        last_name:'Edison',       id_number:'836566', ticket_number:'5784163287', flight_id:'UA2049', status:'Checked-in' },
  { first_name:'Mike',        last_name:'Potulla',      id_number:'555522', ticket_number:'5784083172', flight_id:'UA2049', status:'Checked-in' },
  // Frontier
  { first_name:'Samantha',    last_name:'Foley',        id_number:'893775', ticket_number:'6012788957', flight_id:'FA1270', status:'Boarded' },
  { first_name:'Sara',        last_name:'Olsen',        id_number:'333585', ticket_number:'6012986872', flight_id:'FA3330', status:'Not-checked-in' },
  { first_name:'Maria',       last_name:'Luther',       id_number:'818886', ticket_number:'6012774348', flight_id:'FA3330', status:'Checked-in' },
  { first_name:'Robert',      last_name:'Luther',       id_number:'818752', ticket_number:'6012734714', flight_id:'FA3330', status:'Checked-in' },
  { first_name:'Asim',        last_name:'Khan',         id_number:'298374', ticket_number:'6012345581', flight_id:'FA2147', status:'Checked-in' },
  { first_name:'Maira',       last_name:'Khan',         id_number:'295876', ticket_number:'6012223623', flight_id:'FA2147', status:'Checked-in' },
  { first_name:'Jackson',     last_name:'Burand',       id_number:'104769', ticket_number:'6012166587', flight_id:'FA1270', status:'Boarded' },
  { first_name:'Elizabeth',   last_name:'Burand',       id_number:'104335', ticket_number:'6012603669', flight_id:'FA1270', status:'Boarded' },
  { first_name:'Luke',        last_name:'Simmerson',    id_number:'827364', ticket_number:'6012096705', flight_id:'FA1270', status:'Checked-in' },
  { first_name:'Timothy',     last_name:'Cobalt',       id_number:'907856', ticket_number:'6012466889', flight_id:'FA2147', status:'Checked-in' },
  // Southwest
  { first_name:'Richard',     last_name:'Bloggs',       id_number:'284658', ticket_number:'9024785776', flight_id:'SW2209', status:'Not-checked-in' },
  { first_name:'Sun',         last_name:'Wong',         id_number:'538859', ticket_number:'9029377578', flight_id:'SW2209', status:'Not-checked-in' },
  { first_name:'Ding',        last_name:'Wong',         id_number:'538102', ticket_number:'9021102884', flight_id:'SW2209', status:'Not-checked-in' },
  { first_name:'Maya',        last_name:'Sterling',     id_number:'725656', ticket_number:'9027956745', flight_id:'SW2209', status:'Checked-in' },
  { first_name:'Elias',       last_name:'Thorne',       id_number:'836675', ticket_number:'9028666623', flight_id:'SW2209', status:'Checked-in' },
  { first_name:'Julian',      last_name:'Voss',         id_number:'102775', ticket_number:'9028877593', flight_id:'SW4326', status:'Not-checked-in' },
  { first_name:'Hament',      last_name:'Voss',         id_number:'102443', ticket_number:'9026477104', flight_id:'SW4326', status:'Not-checked-in' },
  { first_name:'Marcus',      last_name:'Holloway',     id_number:'909012', ticket_number:'9020907345', flight_id:'SW1511', status:'Not-checked-in' },
  { first_name:'Elena',       last_name:'Holloway',     id_number:'901544', ticket_number:'9021728384', flight_id:'SW1511', status:'Not-checked-in' },
  { first_name:'Simon',       last_name:'Beck',         id_number:'777236', ticket_number:'9020192837', flight_id:'SW1511', status:'Not-checked-in' },
  { first_name:'Clara',       last_name:'Montgomery',   id_number:'626368', ticket_number:'9021177883', flight_id:'SW1511', status:'Not-checked-in' },
  { first_name:'Avir',        last_name:'Jenkins',      id_number:'535538', ticket_number:'9021582838', flight_id:'SW1511', status:'Not-checked-in' },
  { first_name:'Zara',        last_name:'Chen',         id_number:'173564', ticket_number:'9020902647', flight_id:'SW1485', status:'Not-checked-in' },
  { first_name:'Farah',       last_name:'Quinn',        id_number:'822845', ticket_number:'9025453754', flight_id:'SW1485', status:'Not-checked-in' },
  { first_name:'Leo',         last_name:'Grant',        id_number:'866623', ticket_number:'9023333626', flight_id:'SW1485', status:'Not-checked-in' },
  { first_name:'Mia',         last_name:'Vance',        id_number:'342627', ticket_number:'9021341568', flight_id:'SW1823', status:'Not-checked-in' },
  { first_name:'Desmond',     last_name:'Fitzgerald',   id_number:'253664', ticket_number:'9027675747', flight_id:'SW1823', status:'Not-checked-in' },
  { first_name:'Beatrice',    last_name:'Fitzgerald',   id_number:'253901', ticket_number:'9026655844', flight_id:'SW1823', status:'Not-checked-in' },
  { first_name:'Victoria',    last_name:'Fitzgerald',   id_number:'253189', ticket_number:'9026655285', flight_id:'SW1823', status:'Not-checked-in' },
  { first_name:'Nathan',      last_name:'Brooks',       id_number:'167746', ticket_number:'9021784611', flight_id:'SW1823', status:'Not-checked-in' },
]

const BAGS = [
  { bag_id:'100296', ticket_number:'1025104332', flight_id:'AA1360', location:'Check-in counter' },
  { bag_id:'100401', ticket_number:'1025181960', flight_id:'AA1360', location:'Check-in counter' },
  { bag_id:'100595', ticket_number:'1025083863', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100535', ticket_number:'1025083863', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100525', ticket_number:'1025542351', flight_id:'AA1476', location:'At-the-gate' },
  { bag_id:'100444', ticket_number:'1025161559', flight_id:'AA1476', location:'At-the-gate' },
  { bag_id:'100346', ticket_number:'1025255341', flight_id:'AA2385', location:'Security Check' },
  { bag_id:'100837', ticket_number:'1025928327', flight_id:'AA2385', location:'Security Check' },
  { bag_id:'100462', ticket_number:'1025305641', flight_id:'AA1175', location:'Loaded' },
  { bag_id:'100805', ticket_number:'1025480184', flight_id:'AA1523', location:'Loaded' },
  { bag_id:'100594', ticket_number:'1025489325', flight_id:'AA1656', location:'At-the-gate' },
  { bag_id:'100911', ticket_number:'1025701543', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100939', ticket_number:'1025701543', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100833', ticket_number:'1025039117', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100838', ticket_number:'1025039117', flight_id:'AA3290', location:'Security Check' },
  { bag_id:'100960', ticket_number:'1025871331', flight_id:'AA2385', location:'Security Check' },
  { bag_id:'100208', ticket_number:'1025301031', flight_id:'AA1476', location:'At-the-gate' },
  { bag_id:'100489', ticket_number:'1025051834', flight_id:'AA1476', location:'At-the-gate' },
  { bag_id:'100060', ticket_number:'1025738299', flight_id:'AA1476', location:'At-the-gate' },
  { bag_id:'100642', ticket_number:'1025165667', flight_id:'AA1175', location:'Loaded' },
  { bag_id:'100708', ticket_number:'1025010651', flight_id:'AA1175', location:'Loaded' },
  { bag_id:'100684', ticket_number:'1025333872', flight_id:'AA1175', location:'Loaded' },
  { bag_id:'100959', ticket_number:'1025624731', flight_id:'AA1523', location:'At-the-gate' },
  { bag_id:'100558', ticket_number:'1025118384', flight_id:'AA2385', location:'Security Check' },
  { bag_id:'100386', ticket_number:'1025251354', flight_id:'AA2385', location:'Security Check' },
  { bag_id:'100941', ticket_number:'1025278498', flight_id:'AA1175', location:'Loaded' },
  { bag_id:'100786', ticket_number:'1025084124', flight_id:'AA1360', location:'Check-in counter' },
  { bag_id:'200487', ticket_number:'2373740164', flight_id:'DL2972', location:'Security Check' },
  { bag_id:'200108', ticket_number:'2373005242', flight_id:'DL2972', location:'Security Check' },
  { bag_id:'200645', ticket_number:'2373826204', flight_id:'DL2746', location:'At-the-gate' },
  { bag_id:'200115', ticket_number:'2373505331', flight_id:'DL2746', location:'At-the-gate' },
  { bag_id:'200865', ticket_number:'2373226025', flight_id:'DL0873', location:'Security Check' },
  { bag_id:'200992', ticket_number:'2373226025', flight_id:'DL0873', location:'Security Check' },
  { bag_id:'200221', ticket_number:'2373634216', flight_id:'DL0873', location:'Security Check' },
  { bag_id:'200787', ticket_number:'2373634216', flight_id:'DL0873', location:'Security Check' },
  { bag_id:'500442', ticket_number:'5784299468', flight_id:'UA1586', location:'Check-in counter' },
  { bag_id:'500729', ticket_number:'5784676320', flight_id:'UA1586', location:'Check-in counter' },
  { bag_id:'600109', ticket_number:'6012788957', flight_id:'FA1270', location:'At-the-gate' },
  { bag_id:'600113', ticket_number:'6012774348', flight_id:'FA3330', location:'At-the-gate' },
  { bag_id:'600602', ticket_number:'6012734714', flight_id:'FA3330', location:'At-the-gate' },
  { bag_id:'600836', ticket_number:'6012166587', flight_id:'FA1270', location:'At-the-gate' },
  { bag_id:'600105', ticket_number:'6012603669', flight_id:'FA1270', location:'At-the-gate' },
  { bag_id:'836675', ticket_number:'9028666623', flight_id:'SW2209', location:'Security Check' },
]

// Gate assignments from PDF instructions
const GATE_ASSIGNMENTS = {
  'Mylopolus': 'D01', 'Louise': 'C19', 'Reckon': 'C22',
  'Guelph': 'E17', 'Klein': 'E14',
  'Milner': 'E08',
  'Rangers': 'E02', 'Ashford': 'F18', 'Whitaker': 'F12'
}
const GROUND_ASSIGNMENTS = {
  'Ramos': 'D01', 'Weiner': 'C19', 'Cooper': 'E17', 'Zhang': 'E02'
}

const AIRLINE_STAFF = [
  { firstname:'Sankar',  lastname:'Madhavan',  phone:'9726743787', airline_code:'AA' },
  { firstname:'Alice',   lastname:'Richardson', phone:'9725794785', airline_code:'AA' },
  { firstname:'Mike',    lastname:'Hamsworth',  phone:'9728819003', airline_code:'AA' },
  { firstname:'Tom',     lastname:'Cruise',     phone:'2147593675', airline_code:'DL' },
  { firstname:'Amana',   lastname:'Burgs',      phone:'2148933457', airline_code:'DL' },
  { firstname:'Adam',    lastname:'Frank',      phone:'5148654783', airline_code:'UA' },
  { firstname:'Harry',   lastname:'Johnson',    phone:'6093782645', airline_code:'FA' },
  { firstname:'Cathy',   lastname:'Jameson',    phone:'2140092178', airline_code:'SW' },
  { firstname:'Julian',  lastname:'Prescott',   phone:'9721782746', airline_code:'SW' },
]

const GATE_STAFF = [
  { firstname:'Liam',      lastname:'Mylopolus', phone:'9720231115', airline_code:'AA' },
  { firstname:'Scott',     lastname:'Louise',    phone:'9727626363', airline_code:'AA' },
  { firstname:'Emily',     lastname:'Reckon',    phone:'9729789789', airline_code:'AA' },
  { firstname:'Rudy',      lastname:'Guelph',    phone:'2148109203', airline_code:'DL' },
  { firstname:'Joe',       lastname:'Klein',     phone:'2149336336', airline_code:'DL' },
  { firstname:'Robert',    lastname:'Milner',    phone:'5149365786', airline_code:'UA' },
  { firstname:'Steve',     lastname:'Rangers',   phone:'6096264775', airline_code:'FA' },
  { firstname:'Sabastian', lastname:'Ashford',   phone:'9721021029', airline_code:'SW' },
  { firstname:'Dominic',   lastname:'Whitaker',  phone:'9721131872', airline_code:'SW' },
]

const GROUND_STAFF = [
  { firstname:'Galvin',  lastname:'Ramos',    phone:'9725785964' },
  { firstname:'Robert',  lastname:'Languire', phone:'9722220967' },
  { firstname:'Jacob',   lastname:'Weiner',   phone:'9721102834' },
  { firstname:'Karson',  lastname:'Dillon',   phone:'9720024783' },
  { firstname:'Rocky',   lastname:'White',    phone:'9728778749' },
  { firstname:'Arjun',   lastname:'Singh',    phone:'9725375678' },
  { firstname:'Tom',     lastname:'Cooper',   phone:'9729029090' },
  { firstname:'Minato',  lastname:'Surshki',  phone:'9725775795' },
  { firstname:'Claine',  lastname:'Wauker',   phone:'9725125346' },
  { firstname:'Yeng',    lastname:'Zhang',    phone:'9723433435' },
]

const MY_EMAIL = 'admin@airport.com'

async function main() {
  console.log('=== Loading test data ===\n')
  const accounts = []

  // Check what's already loaded
  const flightCount = await fetch(`${BASE}/flights`).then(r => r.json()).then(d => d.length)
  const passengerCount = await fetch(`${BASE}/passengers`).then(r => r.json()).then(d => d.length)
  const bagCount = await fetch(`${BASE}/baggage`).then(r => r.json()).then(d => d.length)
  const staffCount = await fetch(`${BASE}/staff`).then(r => r.json()).then(d => d.length)

  // 1. Flights
  if (flightCount < FLIGHTS.length) {
    console.log('Loading flights...')
    for (const f of FLIGHTS) {
      try { await post('/flights', f); process.stdout.write('.') }
      catch(e) { if (!e.message.includes('UNIQUE')) throw e }
    }
    console.log(` done`)
  } else {
    console.log(`Flights already loaded (${flightCount})`)
  }

  // 2. Passengers
  if (passengerCount < PASSENGERS.length) {
    console.log('Loading passengers...')
    for (const p of PASSENGERS) {
      try { await post('/passengers', p); process.stdout.write('.') }
      catch(e) { if (!e.message.includes('UNIQUE')) throw e }
    }
    console.log(` done`)
  } else {
    console.log(`Passengers already loaded (${passengerCount})`)
  }

  // 3. Bags
  if (bagCount < BAGS.length) {
    console.log('Loading bags...')
    for (const b of BAGS) {
      const status = LOC_MAP[b.location] || 'Checked-in'
      try {
        await post('/baggage', { bag_id: b.bag_id, ticket_number: b.ticket_number, flight_id: b.flight_id, status, check_in_location: b.location })
        process.stdout.write('.')
      } catch(e) { if (!e.message.includes('UNIQUE')) throw e }
    }
    console.log(` done`)
  } else {
    console.log(`Bags already loaded (${bagCount})`)
  }

  // 4. Airline staff (skip admin which is staff_id=1)
  if (staffCount <= 1) {
    console.log('Loading airline staff...')
    for (const s of AIRLINE_STAFF) {
      const r = await post('/staff', { staff_type:'Airline staff', firstname:s.firstname, lastname:s.lastname, email:MY_EMAIL, phone:s.phone, airline_code:s.airline_code, assignment:s.airline_code })
      accounts.push({ name:`${s.firstname} ${s.lastname}`, role:'Airline staff', assign:s.airline_code, username:r.username, password:r.temp_password })
      process.stdout.write('.')
    }
    console.log(` ${AIRLINE_STAFF.length} airline staff loaded`)

    console.log('Loading gate staff...')
    for (const s of GATE_STAFF) {
      const gate = GATE_ASSIGNMENTS[s.lastname] || 'TBD'
      const r = await post('/staff', { staff_type:'Gate staff', firstname:s.firstname, lastname:s.lastname, email:MY_EMAIL, phone:s.phone, airline_code:s.airline_code, assignment:gate })
      accounts.push({ name:`${s.firstname} ${s.lastname}`, role:'Gate staff', assign:gate, username:r.username, password:r.temp_password })
      process.stdout.write('.')
    }
    console.log(` ${GATE_STAFF.length} gate staff loaded`)

    console.log('Loading ground staff...')
    for (const s of GROUND_STAFF) {
      const gate = GROUND_ASSIGNMENTS[s.lastname] || 'General'
      const r = await post('/staff', { staff_type:'Ground crew', firstname:s.firstname, lastname:s.lastname, email:MY_EMAIL, phone:s.phone, assignment:gate })
      accounts.push({ name:`${s.firstname} ${s.lastname}`, role:'Ground crew', assign:gate, username:r.username, password:r.temp_password })
      process.stdout.write('.')
    }
    console.log(` ${GROUND_STAFF.length} ground staff loaded`)
  } else {
    console.log(`Staff already loaded (${staffCount}), fetching accounts...`)
    // Fetch existing accounts from DB
    const allStaff = await fetch(`${BASE}/staff`).then(r => r.json())
    console.log('Note: passwords not available for existing staff — check staff_accounts.csv if it exists')
  }

  // Print accounts table
  if (accounts.length > 0) {
    console.log('\n=== Staff Accounts (save this!) ===')
    console.log('Name'.padEnd(25) + 'Role'.padEnd(16) + 'Assignment'.padEnd(12) + 'Username'.padEnd(16) + 'Temp Password')
    console.log('-'.repeat(85))
    for (const a of accounts) {
      console.log(a.name.padEnd(25) + a.role.padEnd(16) + a.assign.padEnd(12) + a.username.padEnd(16) + a.password)
    }

    const fs = require('fs')
    const lines = ['Name,Role,Assignment,Username,TempPassword']
    for (const a of accounts) {
      lines.push(`"${a.name}","${a.role}","${a.assign}","${a.username}","${a.password}"`)
    }
    fs.writeFileSync('../第六部分/staff_accounts.csv', lines.join('\n'))
    console.log('\nAccounts saved to 第六部分/staff_accounts.csv')
  }
  console.log('\n=== Done! ===')
}

main().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1) })
