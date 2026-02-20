import { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Loader2, Search, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Alert } from '../types';
import { Link } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

export default function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');

    const loadAlerts = async (currentPage: number, status: string) => {
        try {
            setLoading(true);
            const res = await api.fraud.alerts(currentPage, 50, status === 'all' ? undefined : status);
            setAlerts(res.alerts);
            setTotalPages(res.pages);
            setPage(res.page);
        } catch (error) {
            console.error("Failed to load alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts(1, statusFilter);
    }, [statusFilter]);

    const filteredAlerts = alerts.filter(a =>
        a.id.toString().includes(searchQuery) ||
        (a.fraud_reasons && JSON.stringify(a.fraud_reasons).toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getRiskStyles = (risk: string) => {
        switch (risk) {
            case 'critical': return 'bg-cyber-alert/10 text-cyber-alert border-cyber-alert/20';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-green-500/10 text-green-400 border-green-500/20';
        }
    };

    const getStatusStyles = (status: string | undefined) => {
        switch (status) {
            case 'confirmed_fraud': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'false_positive': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'needs_review': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 relative overflow-hidden pb-12">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-cyber-alert/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-8 py-8 relative z-10 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 text-white font-mono">
                        <AlertTriangle className="w-8 h-8 text-cyber-alert" />
                        ACTION <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-cyber-alert">QUEUE</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm ml-11">Investigate and disposition active threats flagged by the model.</p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0a0f16]/90 backdrop-blur-xl p-4 rounded-2xl border border-gray-800 shadow-xl mb-8"
                >
                    <div className="md:col-span-2 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search threat identifiers or rule triggers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#05080c] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Filter className="w-4 h-4 text-gray-500" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-[#05080c] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all appearance-none"
                        >
                            <option value="pending">Pending Disposition</option>
                            <option value="confirmed_fraud">Confirmed Threats</option>
                            <option value="false_positive">False Positives</option>
                            <option value="all">Global Ledger</option>
                        </select>
                    </div>
                </motion.div>

                {/* Queue Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 text-cyber-alert animate-spin mb-4" />
                        <p className="text-cyber-alert animate-pulse font-mono tracking-widest text-sm">SCANNING QUEUE...</p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-[#0a0f16]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center"
                    >
                        <ShieldAlert className="w-16 h-16 text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Zero Active Threats</h3>
                        <p className="text-gray-500 text-sm max-w-md">The telemetry queue is currently empty matching your filter criteria.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
                        {filteredAlerts.map((alert) => {
                            const reasonStr = alert.fraud_reasons && alert.fraud_reasons.length > 0
                                ? (typeof alert.fraud_reasons[0] === 'string' ? alert.fraud_reasons[0] : JSON.stringify(alert.fraud_reasons[0]))
                                : 'Anomalous deviation detected in network flow';

                            return (
                                <motion.div
                                    key={alert.id}
                                    variants={itemVariants}
                                    className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 hover:border-cyber-alert/40 transition-all shadow-lg group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyber-alert/50 group-hover:bg-cyber-alert transition-colors" />

                                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center ml-2">
                                        <div className="flex-1 space-y-3 w-full">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="text-lg font-black text-white font-mono tracking-tight">#{alert.transaction_id || alert.id}</span>
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskStyles(alert.risk_level)}`}>
                                                    {alert.risk_level} Risk
                                                </span>
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(alert.status)}`}>
                                                    {alert.status?.replace('_', ' ') || 'PENDING'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                                                <div className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                                                    ₹{alert.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-sm text-cyber-alert italic font-medium bg-cyber-alert/5 px-3 py-1 rounded-md border border-cyber-alert/10 line-clamp-1">
                                                    "{reasonStr}"
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                                                <span>TIMESTAMP: {new Date(alert.timestamp || alert.created_at).toLocaleString()}</span>
                                                <span className="flex items-center gap-1">
                                                    MODEL CONFIDENCE: <span className="text-gray-300">{((alert as any).final_score * 100).toFixed(1)}%</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-auto shrink-0 flex items-center">
                                            <Link
                                                to={`/transactions/${alert.transaction_id || alert.id}`}
                                                className="w-full lg:w-auto px-6 py-3 bg-[#05080c] hover:bg-cyber-alert/10 text-cyber-alert font-bold tracking-wider text-sm rounded-xl border border-gray-800 hover:border-cyber-alert/40 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                                            >
                                                OPEN TELEMETRY <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => loadAlerts(page - 1, statusFilter)}
                            className="px-6 py-2.5 border border-gray-800 rounded-lg text-gray-400 text-sm font-bold tracking-wider uppercase hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 font-mono text-sm text-cyber-primary bg-cyber-primary/10 rounded-lg border border-cyber-primary/20">
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => loadAlerts(page + 1, statusFilter)}
                            className="px-6 py-2.5 border border-gray-800 rounded-lg text-gray-400 text-sm font-bold tracking-wider uppercase hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
