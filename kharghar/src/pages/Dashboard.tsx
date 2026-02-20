import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Search, Filter, ShieldCheck, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import RiskMeter from '../components/RiskMeter';
import DataTable from '../components/DataTable';
import CsvUploader from '../components/CsvUploader';
import { api } from '../services/api';
import { Transaction, Alert, DashboardStats } from '../types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, txsRes, alertsRes] = await Promise.all([
        api.fraud.stats(),
        api.transactions.list(1, 50, riskFilter === 'all' ? undefined : riskFilter),
        api.fraud.alerts()
      ]);
      setStats(statsRes);
      setTransactions(txsRes.transactions);
      setAlerts(alertsRes.alerts);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [riskFilter]); // reload when risk filter changes

  const handleUploadSuccess = () => {
    loadData();
  };

  const calculateAverageRisk = (stats: DashboardStats | null) => {
    if (!stats || stats.total_transactions === 0) return 0;
    // rough % based on high/critical weight vs total
    const weighted = (stats.risk_breakdown.critical * 100) + (stats.risk_breakdown.high * 70) + (stats.risk_breakdown.medium * 30);
    return Math.min(100, Math.round(weighted / stats.total_transactions));
  };

  const formatTotalTransactions = (count: number) => {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 relative overflow-hidden pb-12">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="container mx-auto p-6 lg:p-8 space-y-8 relative z-10 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">Center</span>
            </h1>
            <p className="text-gray-400 text-sm">Real-time fraud telemetry and ML risk analysis</p>
          </div>
          <div className="flex bg-[#0a0f16] border border-gray-800 p-1.5 rounded-xl shadow-lg">
            <CsvUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Activity className="text-blue-400 w-5 h-5" />}
            title="Total Volume"
            value={stats ? formatTotalTransactions(stats.total_transactions) : '0'}
            trend={stats ? `+₹${(stats.total_amount || 0).toLocaleString('en-IN')}` : ''}
            status="positive"
            loading={loading}
          />
          <StatCard
            icon={<AlertTriangle className="text-cyber-alert w-5 h-5" />}
            title="Critical Vectors"
            value={stats ? stats.risk_breakdown.critical.toString() : '0'}
            trend="Active Interventions Required"
            status="critical"
            loading={loading}
          />
          <StatCard
            icon={<Zap className="text-yellow-400 w-5 h-5" />}
            title="System Risk Level"
            value={`${calculateAverageRisk(stats)}%`}
            trend="Rolling 24h average"
            status={calculateAverageRisk(stats) > 30 ? 'critical' : 'neutral'}
            loading={loading}
          />
          <StatCard
            icon={<ShieldCheck className="text-green-400 w-5 h-5" />}
            title="Engines Active"
            value="4 / 4"
            trend="Rules, ML, Graph, SHAP"
            status="positive"
            loading={false}
          />
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0a0f16]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-800"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Time Range
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-[#05080c] border border-gray-800 rounded-lg p-2.5 text-sm text-gray-200 focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all"
            >
              <option value="7d">Trailing 7 Days</option>
              <option value="30d">Trailing 30 Days</option>
              <option value="90d">Trailing 90 Days</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Search className="w-3 h-3" /> Search Nodes
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search transaction ID or vendor..."
                className="w-full bg-[#05080c] border border-gray-800 rounded-lg p-2.5 pl-10 text-sm text-gray-200 focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Risk Tolerance
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-[#05080c] border border-gray-800 rounded-lg p-2.5 text-sm text-gray-200 focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all"
            >
              <option value="all">Global Matrix</option>
              <option value="critical">Critical Severity</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>
        </motion.div>

        {/* Combined Content - Masonry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Feed Section (Takes up more space) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-800 shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/50">
                <SectionHeader
                  icon={<Search className="w-5 h-5 text-blue-400" />}
                  title="Transaction Ledger"
                  subtitle={loading ? 'Syncing...' : `Showing last ${transactions.length} nodes`}
                />
                <button className="text-xs flex items-center gap-1 font-medium bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-full transition-colors">
                  Export CSV <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <DataTable transactions={transactions.filter(t => t.id.toString().includes(searchQuery))} />
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1 space-y-6 flex flex-col"
          >
            {/* Real-time Risk Dial */}
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <SectionHeader
                icon={<Activity className="w-5 h-5 text-cyber-primary" />}
                title="Telemetry"
                subtitle="Live Engine Confidence"
              />
              <div className="flex justify-center py-4 relative">
                <div className="absolute inset-0 bg-cyber-primary/5 rounded-full blur-xl scale-75" />
                <RiskMeter score={calculateAverageRisk(stats)} />
              </div>
            </div>

            {/* Alert Feed */}
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-800 shadow-xl flex-1 flex flex-col max-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader
                  icon={<AlertTriangle className="w-5 h-5 text-cyber-alert" />}
                  title="Action Queue"
                  subtitle={`${alerts.length} Pending`}
                  status="critical"
                />
                <Link to="/alerts" className="text-xs text-gray-500 hover:text-white transition-colors">View All</Link>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {alerts.map((alert, idx) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    key={alert.id}
                  >
                    <AlertCard alert={alert} />
                  </motion.div>
                ))}
                {alerts.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 py-12">
                    <ShieldCheck className="w-12 h-12 text-gray-800" />
                    <p className="text-sm font-medium">All clear. Zero active alerts.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Global CSS for custom scrollbar hidden mostly */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

const StatCard = ({ title, value, trend, status, loading, icon }: {
  title: string;
  value: string;
  trend?: string;
  status?: 'positive' | 'critical' | 'neutral';
  loading: boolean;
  icon: React.ReactNode;
}) => (
  <motion.div
    variants={itemVariants}
    className="bg-[#0a0f16]/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all shadow-lg group relative overflow-hidden"
  >
    {/* Subtle gradient hover effect */}
    {status === 'critical' && <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-alert/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-cyber-alert/10 transition-colors pointer-events-none" />}

    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
        {icon}
      </div>
      {status === 'critical' && value !== '0' && (
        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-cyber-alert/10 text-cyber-alert px-2 py-1 rounded-full border border-cyber-alert/20 scale-90 origin-top-right">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-alert animate-pulse" /> Action Req
        </span>
      )}
    </div>

    <div className="space-y-1 relative z-10">
      <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      <div className="text-3xl font-black text-white tracking-tight">
        {loading ? <span className="animate-pulse text-gray-700">--</span> : value}
      </div>
      {(trend || loading) && (
        <div className="flex items-center gap-1.5 pt-1">
          {status === 'positive' && !loading && <TrendingUp className="w-3 h-3 text-green-400" />}
          <span className={`text-xs font-medium ${status === 'positive' ? 'text-green-400' :
            status === 'critical' ? 'text-cyber-alert/80' :
              'text-gray-500'
            }`}>
            {loading ? 'calculating...' : trend}
          </span>
        </div>
      )}
    </div>
  </motion.div>
);

const SectionHeader = ({ icon, title, subtitle, status }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: 'critical';
}) => (
  <div className={`flex flex-col ${status === 'critical' ? 'text-cyber-alert' : 'text-white'}`}>
    <div className="flex items-center gap-2 font-semibold text-base tracking-tight mb-0.5">
      {icon}
      <h2>{title}</h2>
    </div>
    {subtitle && <span className="text-[10px] text-gray-500 font-medium pl-6">{subtitle}</span>}
  </div>
);

const AlertCard = ({ alert }: { alert: Alert }) => {
  const reasonStr = alert.fraud_reasons && alert.fraud_reasons.length > 0
    ? (typeof alert.fraud_reasons[0] === 'string' ? alert.fraud_reasons[0] : JSON.stringify(alert.fraud_reasons[0]))
    : 'Anomalous deviation detected in network flow';

  // Format amount safely
  const amountStr = typeof alert.amount === 'number'
    ? `₹${alert.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'N/A';

  return (
    <div className="p-3 bg-gray-900/40 rounded-xl border border-gray-800 hover:border-cyber-alert/30 hover:bg-cyber-alert/5 transition-all group">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-alert animate-pulse" />
            <h3 className="text-white font-medium text-xs">Target: #{alert.transaction_id || alert.id}</h3>
          </div>
          <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border ${alert.risk_level === 'critical' ? 'bg-cyber-alert/10 text-cyber-alert border-cyber-alert/20' :
            alert.risk_level === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
            {alert.risk_level} Risk
          </span>
        </div>

        <div className="pl-4 border-l-2 border-gray-800 py-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-black text-gray-200">{amountStr}</span>
            <span className="text-[10px] text-gray-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-1 italic">
            "{reasonStr}"
          </p>
        </div>

        <Link
          to={`/transactions/${alert.transaction_id || alert.id}`}
          className="w-full mt-1 py-2 bg-[#05080c] text-cyber-alert rounded-lg border border-gray-800 hover:border-cyber-alert/40 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 group-hover:bg-cyber-alert/10 transition-colors"
        >
          View Full Telemetry <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
