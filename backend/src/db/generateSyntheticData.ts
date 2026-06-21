import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Lists of seed data for generation
const DISTRICTS = [
  'Bengaluru East', 'Bengaluru West', 'Bengaluru North', 'Bengaluru South',
  'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Shivamogga', 'Davanagere', 'Kalaburagi'
];

const CRIME_TYPES = [
  'Cyber Fraud', 'Theft', 'Robbery', 'Assault', 'Financial Crime', 'Vehicle Theft', 'Burglary', 'Narcotics'
];

const STATUSES = ['Pending', 'Under Investigation', 'Completed', 'Closed'];

const MALE_NAMES = [
  'Suresh', 'Ravi', 'Amit', 'Kiran', 'Vikram', 'Rajesh', 'Karthik', 'Anil', 'Vijay', 'Sanjay',
  'Mahesh', 'Ganesh', 'Mohan', 'Naveen', 'Praveen', 'Santosh', 'Deepak', 'Sandesh', 'Raghu',
  'Manjunath', 'Basavaraj', 'Shivakumar', 'Girish', 'Prashanth', 'Harish', 'Ramesh', 'Srinivas',
  'Ananth', 'Nagaraj', 'Vinay'
];

const FEMALE_NAMES = [
  'Latha', 'Priya', 'Shreya', 'Deepa', 'Sunitha', 'Geetha', 'Kavitha', 'Asha', 'Divya', 'Vidya',
  'Sudha', 'Rekha', 'Meena', 'Rupa', 'Anitha', 'Lakshmi', 'Radha', 'Saraswathi', 'Preethi', 'Neela',
  'Jyothi', 'Savitha', 'Pushpa', 'Bhagya', 'Gowri', 'Mamatha', 'Poornima', 'Roopa', 'Saritha', 'Uma'
];

const SURNAMES = [
  'Gowda', 'Kumar', 'Hegde', 'Naik', 'Sharma', 'Bhat', 'Patil', 'Ali', 'Rao', 'Sen', 'Nair',
  'Reddy', 'Shetty', 'Desai', 'Joshi', 'Kulkarni', 'Prasad', 'Menezes', 'Pinto', 'Acharya',
  'Sastry', 'Murthy', 'Jadhav', 'Kamat', 'Pai', 'Shenoy', 'Raju', 'Swamy', 'Hiremath', 'Bhandary'
];

const OCCUPATIONS = [
  'Software Engineer', 'Contractor', 'Student', 'Delivery Executive', 'Unemployed', 'Teacher',
  'Homemaker', 'Business Owner', 'Bank Clerk', 'Shop Owner', 'Driver', 'Mechanic', 'Farmer',
  'Security Guard', 'Accountant', 'Sales Executive', 'Police Officer', 'Lawyer', 'Doctor', 'Retired'
];

// Helper to get random item
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random range
function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic locations inside Karnataka bounding box
function generateLocations(count: number) {
  const locations = [];
  const coords: Record<string, { lat: number; lng: number }> = {
    'Bengaluru East': { lat: 12.9716, lng: 77.5946 },
    'Bengaluru West': { lat: 12.9722, lng: 77.5300 },
    'Bengaluru North': { lat: 13.0358, lng: 77.5970 },
    'Bengaluru South': { lat: 12.9081, lng: 77.5900 },
    'Mysuru': { lat: 12.2958, lng: 76.6394 },
    'Mangaluru': { lat: 12.9141, lng: 74.8560 },
    'Hubballi': { lat: 15.3647, lng: 75.1240 },
    'Belagavi': { lat: 15.8497, lng: 74.4977 },
    'Shivamogga': { lat: 13.9299, lng: 75.5681 },
    'Davanagere': { lat: 14.4644, lng: 75.9218 },
    'Kalaburagi': { lat: 17.3297, lng: 76.8343 }
  };

  for (let i = 1; i <= count; i++) {
    const district = randomItem(DISTRICTS);
    const base = coords[district] || { lat: 12.97, lng: 77.59 };
    // Add small random offset
    const latitude = parseFloat((base.lat + (Math.random() - 0.5) * 0.1).toFixed(4));
    const longitude = parseFloat((base.lng + (Math.random() - 0.5) * 0.1).toFixed(4));

    locations.push({
      location_id: i,
      district,
      latitude,
      longitude
    });
  }
  return locations;
}

// Generate Accused Profile
function generateAccused(count: number) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.15;
    const firstName = randomItem(isMale ? MALE_NAMES : FEMALE_NAMES);
    const lastName = randomItem(SURNAMES);
    list.push({
      accused_id: i,
      name: `${firstName} ${lastName}`,
      age: randomRange(18, 68),
      gender: isMale ? 'Male' : 'Female',
      occupation: randomItem(OCCUPATIONS),
      risk_score: randomRange(10, 95)
    });
  }
  return list;
}

// Generate Victim Profile
function generateVictims(count: number) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.45;
    const firstName = randomItem(isMale ? MALE_NAMES : FEMALE_NAMES);
    const lastName = randomItem(SURNAMES);
    list.push({
      victim_id: i,
      name: `${firstName} ${lastName}`,
      age: randomRange(10, 85),
      gender: isMale ? 'Male' : 'Female',
      occupation: randomItem(OCCUPATIONS)
    });
  }
  return list;
}

// Generate FIRs with descriptions
function generateFIRs(count: number, locationCount: number) {
  const list = [];
  const start = new Date(2024, 0, 1).getTime();
  const end = new Date(2026, 5, 20).getTime(); // June 2026

  for (let i = 1; i <= count; i++) {
    const fir_id = `FIR-${1000 + i}`;
    const crime_type = randomItem(CRIME_TYPES);
    const location_id = randomRange(1, locationCount);
    const status = randomItem(STATUSES);
    
    // Random Date
    const randomDate = new Date(start + Math.random() * (end - start));
    const dateStr = randomDate.toISOString().split('T')[0];

    // Generate descriptive summary
    let description = '';
    if (crime_type === 'Cyber Fraud') {
      const amt = randomRange(25, 800) * 1000;
      description = `Unauthorized UPI/phishing transaction resulting in transfer of INR ${amt} from victim account via links.`;
    } else if (crime_type === 'Theft') {
      const item = randomItem(['laptops', 'gold necklace', 'mobile phone', 'cash box']);
      description = `Report of theft of ${item} from a residential area during night hours.`;
    } else if (crime_type === 'Robbery') {
      description = `Aggravated robbery at local shop counter by suspects carrying sharp instruments. Cash stolen.`;
    } else if (crime_type === 'Assault') {
      description = `Physical assault and altercation following argument over parking space in municipal market.`;
    } else if (crime_type === 'Financial Crime') {
      const amt = randomRange(5, 50);
      description = `Embezzlement and corporate financial fraud involving unauthorized vendor invoice billing of INR ${amt} Lakhs.`;
    } else if (crime_type === 'Vehicle Theft') {
      const vehicle = randomItem(['Royal Enfield bike', 'Honda Activa', 'Suzuki Swift car']);
      description = `Vehicle theft of a ${vehicle} parked near local metro station. Suspects unknown.`;
    } else if (crime_type === 'Burglary') {
      description = `Daytime house burglary in housing society. Gold jewelry and cash stolen while owners away.`;
    } else {
      description = `Seizure of commercial quantities of contraband narcotics from suspect possession at bus check-post.`;
    }

    list.push({
      fir_id,
      crime_type,
      date: dateStr,
      location_id,
      status,
      description
    });
  }
  return list;
}

// Generate transactions linked to Cyber Fraud/Financial Crime
function generateTransactions(count: number) {
  const list = [];
  const start = new Date(2024, 0, 1).getTime();
  const end = new Date(2026, 5, 20).getTime();

  for (let i = 1; i <= count; i++) {
    const transaction_id = `TXN-${1000 + i}`;
    const from_account = Array.from({ length: 10 }, () => randomRange(0, 9)).join('');
    const to_account = Array.from({ length: 10 }, () => randomRange(0, 9)).join('');
    const amount = parseFloat((randomRange(10, 999) * 1000 + Math.random() * 1000).toFixed(2));
    const randomDate = new Date(start + Math.random() * (end - start));
    const dateStr = randomDate.toISOString().split('T')[0];

    list.push({
      transaction_id,
      from_account,
      to_account,
      amount,
      date: dateStr
    });
  }
  return list;
}

// Generate Crime links linking FIR to Accused and Victims
function generateCrimeLinks(firs: any[], accusedCount: number, victimCount: number) {
  const links: any[] = [];
  const seen = new Set<string>();

  firs.forEach(fir => {
    // Each case has 1-2 accused and 1-2 victims
    const aCount = randomRange(1, 2);
    const vCount = randomRange(1, 2);
    
    const localAccused: number[] = [];
    while (localAccused.length < aCount) {
      const aId = randomRange(1, accusedCount);
      if (!localAccused.includes(aId)) localAccused.push(aId);
    }

    const localVictims: number[] = [];
    while (localVictims.length < vCount) {
      const vId = randomRange(1, victimCount);
      if (!localVictims.includes(vId)) localVictims.push(vId);
    }

    // Associate
    localAccused.forEach(aId => {
      localVictims.forEach(vId => {
        const key = `${fir.fir_id}-${aId}-${vId}`;
        if (!seen.has(key)) {
          seen.add(key);
          links.push({
            fir_id: fir.fir_id,
            accused_id: aId,
            victim_id: vId
          });
        }
      });
    });
  });

  return links;
}

// Save to CSV helpers
function writeCSV(filename: string, headers: string[], data: any[]) {
  const filePath = path.join(DATA_DIR, filename);
  const rows = [headers.join(',')];
  
  data.forEach(item => {
    const values = headers.map(header => {
      let val = item[header];
      if (val === undefined || val === null) return '';
      // Escape commas and double quotes for safety
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
        if (val.includes(',') || val.includes('\n') || val.includes('"')) {
          val = `"${val}"`;
        }
      }
      return val;
    });
    rows.push(values.join(','));
  });

  fs.writeFileSync(filePath, rows.join('\n'), 'utf8');
  console.log(`Saved ${data.length} records to ${filePath}`);
}

// Main logic
export function generateAllData() {
  console.log('Generating synthetic Karnataka Crime Data...');
  const locations = generateLocations(100);
  const accused = generateAccused(300);
  const victims = generateVictims(300);
  const firs = generateFIRs(500, 100);
  const txns = generateTransactions(1000);
  const links = generateCrimeLinks(firs, 300, 300);

  // Write CSV files
  writeCSV('locations.csv', ['location_id', 'district', 'latitude', 'longitude'], locations);
  writeCSV('accused.csv', ['accused_id', 'name', 'age', 'gender', 'occupation', 'risk_score'], accused);
  writeCSV('victims.csv', ['victim_id', 'name', 'age', 'gender', 'occupation'], victims);
  writeCSV('firs.csv', ['fir_id', 'crime_type', 'date', 'location_id', 'status', 'description'], firs);
  writeCSV('transactions.csv', ['transaction_id', 'from_account', 'to_account', 'amount', 'date'], txns);
  writeCSV('crime_links.csv', ['fir_id', 'accused_id', 'victim_id'], links);

  // Generate PostgreSQL Seeding script
  const sqlLines: string[] = ['-- PostgreSQL Seeding Script', 'BEGIN;'];
  
  // Locations insert
  locations.forEach(loc => {
    sqlLines.push(`INSERT INTO location (location_id, district, latitude, longitude) VALUES (${loc.location_id}, '${loc.district.replace(/'/g, "''")}', ${loc.latitude}, ${loc.longitude}) ON CONFLICT DO NOTHING;`);
  });
  
  // Accused insert
  accused.forEach(acc => {
    sqlLines.push(`INSERT INTO accused (accused_id, name, age, gender, occupation, risk_score) VALUES (${acc.accused_id}, '${acc.name.replace(/'/g, "''")}', ${acc.age}, '${acc.gender}', '${acc.occupation?.replace(/'/g, "''") || ''}', ${acc.risk_score}) ON CONFLICT DO NOTHING;`);
  });

  // Victims insert
  victims.forEach(vic => {
    sqlLines.push(`INSERT INTO victim (victim_id, name, age, gender, occupation) VALUES (${vic.victim_id}, '${vic.name.replace(/'/g, "''")}', ${vic.age}, '${vic.gender}', '${vic.occupation?.replace(/'/g, "''") || ''}') ON CONFLICT DO NOTHING;`);
  });

  // FIRs insert
  firs.forEach(fir => {
    sqlLines.push(`INSERT INTO fir (fir_id, crime_type, date, location_id, status, description) VALUES ('${fir.fir_id}', '${fir.crime_type}', '${fir.date}', ${fir.location_id}, '${fir.status}', '${fir.description.replace(/'/g, "''")}') ON CONFLICT DO NOTHING;`);
  });

  // Transactions insert
  txns.forEach(txn => {
    sqlLines.push(`INSERT INTO transaction_table (transaction_id, from_account, to_account, amount, date) VALUES ('${txn.transaction_id}', '${txn.from_account}', '${txn.to_account}', ${txn.amount}, '${txn.date}') ON CONFLICT DO NOTHING;`);
  });

  // Links insert
  links.forEach(link => {
    sqlLines.push(`INSERT INTO crime_link (fir_id, accused_id, victim_id) VALUES ('${link.fir_id}', ${link.accused_id}, ${link.victim_id}) ON CONFLICT DO NOTHING;`);
  });

  sqlLines.push('COMMIT;');

  const sqlPath = path.resolve(__dirname, '../../db/postgres/seed.sql');
  // Ensure directory exists
  if (!fs.existsSync(path.dirname(sqlPath))) {
    fs.mkdirSync(path.dirname(sqlPath), { recursive: true });
  }
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');
  console.log(`Saved PostgreSQL seed SQL to ${sqlPath}`);

  return { locations, accused, victims, firs, txns, links };
}

// Run if called directly
if (require.main === module) {
  generateAllData();
}
