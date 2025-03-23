import { faker } from '@faker-js/faker';

// New constants for fraud rate configuration
const BASE_FRAUD_RATE = 0.3; // 30% base rate
const FRAUD_VARIANCE = 0.15; // ±15% variation

// Helper function: randomly shuffles an array
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

// Helper function: select a random fraud pattern based on weighted probabilities
const selectRandomPattern = (patterns: string[], index: number) => {
  const weights = [0.4, 0.3, 0.2, 0.1]; // Example weights for the first 4 patterns
  // For simplicity, we use a weighted chance on the modulo of the index
  let patternIndex = weights.findIndex((w) => Math.random() < w * ((index % 4) + 1));
  return patterns[patternIndex] || patterns[0];
};

// Helper function: apply a fraud pattern modification to a transaction
// Pass the current transactions array to support duplicate-payment
const applyFraudPattern = (pattern: string, tx: Transaction, transactions: Transaction[]) => {
  switch (pattern) {
    case 'duplicate-payment':
      if (transactions.length > 0) {
        const randomTx = transactions[Math.floor(Math.random() * transactions.length)];
        tx.amount = randomTx.amount;
      }
      break;
    case 'after-hours-activity':
      tx.date = faker.date.between({
        from: '2024-03-01T22:00:00Z',
        to: '2024-03-02T05:00:00Z'
      }).toISOString();
      break;
    // Add additional pattern cases as needed...
    default:
      break;
  }
};

// Updated Transaction interface with additional fields
export interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: 'IT' | 'Office' | 'Services' | 'Travel' | 'Cryptocurrency' | 'Suspicious';
  ipCountry: string;
  vendorCountry: string;
  timeSinceLast: number;
}

// Modified calculateRiskLevel function with randomized thresholds
const calculateRiskLevel = (tx: Transaction): 'low' | 'medium' | 'high' => {
  let riskScore = 0;

  // Amount scoring
  if (tx.amount > 10000) riskScore += 40;
  else if (tx.amount > 5000) riskScore += 20;

  // Vendor scoring
  if (tx.vendor.includes('Unknown') || tx.vendor.includes('New Vendor')) riskScore += 30;

  // Geography scoring
  if (tx.ipCountry !== tx.vendorCountry) riskScore += 25;

  // Timing scoring
  if (tx.timeSinceLast < 60) riskScore += 35;

  // Category scoring
  if (tx.category === 'Cryptocurrency') riskScore += 30;

  // Randomized thresholds
  const randomizedThresholds = {
    high: 70 + Math.random() * 10,  // between 70 and 80
    medium: 40 + Math.random() * 15 // between 40 and 55
  };

  if (riskScore > randomizedThresholds.high) return 'high';
  if (riskScore > randomizedThresholds.medium) return 'medium';
  return 'low';
};

// Modified generateDemoData function
const generateDemoData = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const fraudPatterns = shuffle([
    'high-amount-new-vendor',
    'country-mismatch',
    'rapid-transactions',
    'category-anomaly',
    'duplicate-payment',
    'after-hours-activity'
  ]);

  // Randomize fraud rate between 15-45%
  const fraudRate = BASE_FRAUD_RATE + (Math.random() * FRAUD_VARIANCE * 2 - FRAUD_VARIANCE);
  const totalFraud = Math.floor(1000 * fraudRate);

  // Reset faker seed for unique values each upload
  faker.seed(Date.now());

  for (let i = 0; i < 1000; i++) {
    const baseAmount = faker.number.float({ min: 50, max: 10000 });
    let amount = baseAmount;
    let vendor = faker.company.name();
    let category = faker.helpers.arrayElement(['IT', 'Office', 'Services', 'Travel', 'Cryptocurrency']);
    let ipCountry = faker.location.countryCode();
    let vendorCountry = faker.location.countryCode();
    let timeSinceLast = faker.number.int({ min: 60, max: 86400 });
    let date = faker.date.recent({ days: 30 }).toISOString();

    const tx: Transaction = {
      id: `tx-${faker.string.uuid()}`,
      date,
      vendor,
      amount: parseFloat(amount.toFixed(2)),
      riskLevel: 'low', // temporary, will update below
      category,
      ipCountry,
      vendorCountry,
      timeSinceLast,
    };

    // Mark first totalFraud transactions as fraudulent
    const isFraud = i < totalFraud;
    if (isFraud) {
      const pattern = selectRandomPattern(fraudPatterns, i);
      switch (pattern) {
        case 'high-amount-new-vendor':
          amount = faker.number.float({ min: 10000, max: 50000 });
          vendor = 'New Vendor ' + faker.string.alphanumeric(5);
          break;
        case 'country-mismatch':
          ipCountry = 'US';
          vendorCountry = faker.helpers.arrayElement(['NG', 'RU', 'CN']);
          break;
        case 'rapid-transactions':
          timeSinceLast = faker.number.int({ min: 1, max: 59 });
          break;
        case 'category-anomaly':
          category = 'Cryptocurrency';
          break;
        // For patterns handled in applyFraudPattern:
        case 'duplicate-payment':
        case 'after-hours-activity':
          applyFraudPattern(pattern, tx, transactions);
          break;
        default:
          break;
      }
    }
    // Update transaction fields after modifications
    tx.amount = parseFloat(amount.toFixed(2));
    tx.vendor = vendor;
    tx.category = category;
    tx.ipCountry = ipCountry;
    tx.vendorCountry = vendorCountry;
    tx.timeSinceLast = timeSinceLast;
    tx.riskLevel = calculateRiskLevel(tx);

    transactions.push(tx);
  }

  // Add guaranteed fraud alerts with fixed values
  for (let i = 0; i < 10; i++) {
    transactions.push({
      id: `fraud-${i}`,
      date: new Date().toISOString(),
      vendor: 'New Vendor ' + faker.string.alphanumeric(5),
      amount: 15000 + Math.random() * 35000,
      riskLevel: 'high',
      category: 'Suspicious',
      ipCountry: 'US',
      vendorCountry: 'RU',
      timeSinceLast: 30,
    });
  }

  return shuffle(transactions);
};

export { generateDemoData, calculateRiskLevel, shuffle, selectRandomPattern, applyFraudPattern };
