export interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  ipCountry: string;
  vendorCountry: string;
  timeSinceLast: number;
}
  
  export interface Alert {
    id: string;
    title: string;
    vendor: string;
    amount: string;
    reason: string;
    date: string;
    status: 'Critical' | 'Warning';
  }