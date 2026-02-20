// types.ts
export interface FraudVerdict {
  is_fraud: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  rule_score: number;
  network_score: number;
  final_score: number;
  flags: string[];
  shap_reasons: string[];
  critical_hit: boolean;
  review_required: boolean;
  verdict_source: string;
}

export interface Transaction {
  id: number;
  business_id: number;
  amount: number;
  suspicious_flag: boolean;
  risk_level: string;
  confidence_score: number;
  final_score: number;
  fraud_reasons: string[]; // JSON array parsed
  shap_reasons: string[];  // JSON array parsed
  review_status: 'auto_cleared' | 'needs_review' | 'confirmed_fraud' | 'false_positive';
  reviewed_by: string | null;
  created_at: string;
  timestamp: string;
  // Dynamic fields from CSV parsing might not be strictly typed in the DB,
  // but if returned by API they can go here. For now, strictly DB fields.
}

export interface Business {
  id: number;
  firebase_uid: string;
  name: string;
  industry: string;
  country: string;
  created_at: string;
  average_transaction_value?: number;
}

export interface Alert {
  id: number | string;
  transaction_id?: number | string;
  business_id: number;
  amount: number;
  risk_level: string;
  fraud_reasons: string[];
  created_at: string;
  timestamp: string;
  status?: string; // from review_status
}

export interface DashboardStats {
  total_transactions: number;
  total_amount: number;
  flagged_transactions: number;
  flagged_amount: number;
  fraud_rate: number;
  risk_breakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}