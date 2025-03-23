import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, BarChart, Search, Filter } from 'lucide-react';
import RiskMeter from '../components/RiskMeter';
import DataTable from '../components/DataTable';
import CsvUploader from '../components/CsvUploader';
import { Transaction } from '../types';

interface Alert {
  id: string;
  transactionId: string;
  title: string;
  amount: string;
  date: string;
  reason: string;
  status: 'Critical' | 'Warning';
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'A1',
      title: 'Unverified Vendor Payment',
      amount: '$15,000',
      date: new Date().toISOString(),
      reason: 'Manual review required',
      status: 'Critical',
      transactionId: ''
    },
    {
      id: 'A2',
      title: 'Duplicate Transaction',
      amount: '$2,500',
      date: new Date().toISOString(),
      reason: 'Possible duplicate',
      status: 'Warning',
      transactionId: ''
    },
  ]);

  // Replace existing transactions with new ones
  const handleFileUpload = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery) ||
      (tx.category && tx.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRisk = riskFilter === 'all' || tx.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Update alerts whenever transactions change (derived alerts)
  useEffect(() => {
    const newAlerts = transactions.flatMap(tx => {
      const alertsForTx: Alert[] = [];

      // High Risk Detection
      if (tx.riskLevel === 'high') {
        alertsForTx.push({
          id: `high-risk-${tx.id}`,
          transactionId: tx.id,
          title: 'High Risk Transaction',
          amount: `$${tx.amount.toLocaleString()}`,
          date: tx.date,
          reason: 'High risk score based on transaction patterns',
          status: 'Critical'
        });
      }

      // Geography Mismatch Detection
      if (tx.ipCountry !== tx.vendorCountry) {
        alertsForTx.push({
          id: `geo-${tx.id}`,
          transactionId: tx.id,
          title: 'Geography Mismatch',
          amount: `$${tx.amount.toLocaleString()}`,
          date: tx.date,
          reason: `IP Country (${tx.ipCountry}) ≠ Vendor Country (${tx.vendorCountry})`,
          status: 'Warning'
        });
      }

      // New Vendor Detection
      if (tx.vendor.includes('New Vendor')) {
        alertsForTx.push({
          id: `vendor-${tx.id}`,
          transactionId: tx.id,
          title: 'New Vendor Transaction',
          amount: `$${tx.amount.toLocaleString()}`,
          date: tx.date,
          reason: 'First transaction with this vendor',
          status: 'Critical'
        });
      }

      return alertsForTx;
    });

    setAlerts(newAlerts);
  }, [transactions]);

  // Shuffle alerts when the number of transactions changes
  useEffect(() => {
    setAlerts(prevAlerts => [...prevAlerts].sort(() => Math.random() - 0.5));
  }, [transactions.length]);

  // Helper function to calculate average risk score
  const calculateAverageRisk = (transactions: Transaction[]) => {
    const riskValues = {
      low: 20,
      medium: 50,
      high: 80
    };
    const total = transactions.reduce((acc, tx) => acc + riskValues[tx.riskLevel], 0);
    return Math.round(total / transactions.length) || 0;
  };

  // Format the transaction count to display in thousands if needed
  const formatTotalTransactions = (count: number) => {
    return count >= 1000 ? `${Math.floor(count / 1000)}K` : count.toString();
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100">
      <main className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start">
          <h1 className="text-3xl font-bold text-cyber-primary mb-4 md:mb-0">
            Financial Dashboard
            <AlertTriangle className="inline ml-2 w-6 h-6" />
          </h1>
          <CsvUploader onUpload={handleFileUpload} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Transactions" 
            value={formatTotalTransactions(transactions.length)} 
            trend="↑ 12%" 
            status="positive"
          />
          <StatCard 
            title="High Risk Alerts" 
            value={alerts.filter(a => a.status === 'Critical').length.toString()} 
            status="critical"
          />
          <StatCard 
            title="Risk Score" 
            value={`${calculateAverageRisk(transactions)}%`} 
            status="neutral"
          />
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              <Filter className="inline mr-2" />
              Time Range
            </label>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              <Search className="inline mr-2" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-cyber-dark-secondary p-4 rounded-lg">
            <label className="block text-sm text-cyber-primary mb-2">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
            >
              <option value="all">All Risks</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Combined Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk & Alerts Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
              <SectionHeader
                icon={<Activity className="w-5 h-5" />}
                title="Risk Overview"
                subtitle="Last scan: 2 minutes ago"
              />
              <div className="flex justify-center">
                <RiskMeter score={calculateAverageRisk(transactions)} />
              </div>
            </div>

            <div className="bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
              <SectionHeader
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Active Alerts"
                subtitle={`${alerts.length} new alerts`}
                status="critical"
              />
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} {...alert} />
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Analysis Section */}
          <div className="lg:col-span-2 bg-cyber-dark/80 backdrop-blur-lg p-6 rounded-xl border border-cyber-primary/20">
            <SectionHeader
              icon={<Search className="w-5 h-5" />}
              title="Transaction Analysis"
              subtitle={`Showing ${filteredTransactions.length} transactions`}
            />
            <DataTable transactions={filteredTransactions} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Components

const StatCard = ({ title, value, trend, status }: {
  title: string;
  value: string;
  trend?: string;
  status?: 'positive' | 'critical' | 'neutral';
}) => (
  <div className="bg-gray-900/50 p-6 rounded-xl border border-cyber-primary/20 hover:border-cyber-primary/40 transition-colors">
    <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
    <div className="flex items-center justify-between">
      <div className="text-3xl font-bold text-cyber-primary">{value}</div>
      {status === 'critical' ? (
        <span className="text-cyber-alert text-sm">Requires Action</span>
      ) : status === 'positive' ? (
        <span className="text-green-400 text-sm">{trend}</span>
      ) : (
        <span className="text-gray-400 text-sm">{trend}</span>
      )}
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle, status }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: 'critical';
}) => (
  <div className={`mb-6 ${status === 'critical' ? 'text-cyber-alert' : 'text-cyber-primary'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
    </div>
  </div>
);

const AlertCard = ({ title, amount, status, date, reason }: {
  title: string;
  amount: string;
  status: string;
  date: string;
  reason: string;
}) => (
  <div className="p-4 bg-gray-900/50 rounded-lg border border-cyber-alert/20 hover:border-cyber-alert/40 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-cyber-alert font-medium">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{amount}</p>
        <p className="text-xs text-gray-500">{date}</p>
        <p className="text-xs text-gray-500">{reason}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-cyber-alert/10 text-cyber-alert text-sm rounded-full">
          {status}
        </span>
        <button className="px-4 py-2 bg-cyber-alert/20 text-cyber-alert rounded-lg hover:bg-cyber-alert/30 transition-colors">
          Investigate
        </button>
      </div>
    </div>
  </div>
);
