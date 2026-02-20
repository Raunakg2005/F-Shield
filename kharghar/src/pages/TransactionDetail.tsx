import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, XCircle, Activity, ShieldCheck, Loader2, Fingerprint, Database, TriangleAlert, Cpu, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Transaction } from '../types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function TransactionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [shapReasons, setShapReasons] = useState<{ feature: string; impact: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [txRes, explainRes] = await Promise.all([
                    api.transactions.get(Number(id)),
                    api.transactions.explain(Number(id))
                ]);
                setTransaction(txRes);
                setShapReasons(explainRes.top_reasons || []);
            } catch (err) {
                console.error("Failed to load transaction:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleReview = async (status: 'confirmed_fraud' | 'false_positive') => {
        if (!id || !transaction) return;
        try {
            setReviewing(true);
            const updatedTx = await api.transactions.review(Number(id), status);
            setTransaction(updatedTx);
        } catch (err) {
            console.error("Failed to submit review:", err);
        } finally {
            setReviewing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-cyber-primary animate-spin" />
                    <p className="text-cyber-primary animate-pulse font-mono tracking-widest text-sm">DECRYPTING TELEMETRY...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-[#030712] text-gray-100 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <ShieldAlert className="w-16 h-16 text-cyber-alert mx-auto" />
                    <h2 className="text-2xl font-bold">Transaction Not Found</h2>
                    <p className="text-gray-500">The requested telemetry payload could not be located in the ledger.</p>
                    <button onClick={() => navigate(-1)} className="text-cyber-primary hover:text-white transition-colors">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    // Parse rule triggers from JSON if stringified multiple times
    let rules: any[] = [];
    try {
        rules = transaction.fraud_reasons || [];
        if (typeof rules[0] === 'string' && rules[0].startsWith('{')) {
            rules = rules.map(r => typeof r === 'string' ? JSON.parse(r) : r);
        }
    } catch (e) {
        console.error("Failed to parse rules:", e);
    }

    const confidenceScore = (((transaction as any).confidence_score ?? (transaction as any).confidence ?? 0) * 100).toFixed(1);
    const finalScore = ((transaction.final_score || 0) * 100).toFixed(1);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
            case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            default: return 'text-green-400 border-green-500/30 bg-green-500/10';
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 relative overflow-x-hidden pb-16">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-8 py-8 relative z-10 max-w-7xl">
                {/* Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center text-sm font-medium text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Command Center
                </button>

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-white/5"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Fingerprint className="w-8 h-8 text-cyber-primary" />
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight font-mono text-white">
                                Target #{transaction.id}
                            </h1>
                            <span className={`px-3 py-1 rounded border text-xs uppercase font-bold tracking-wider ${getRiskColor(transaction.risk_level)}`}>
                                {transaction.risk_level} Risk
                            </span>
                        </div>
                        <p className="text-gray-400 font-mono text-sm ml-11">
                            {new Date((transaction as any).timestamp || transaction.created_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-1">Transaction Value</div>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 font-mono">
                            ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                >
                    {/* Left Column - ML & Rules Intelligence */}
                    <div className="xl:col-span-2 space-y-8">

                        {/* Summary / Fraud Insights */}
                        {rules.length > 0 && (
                            <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl rounded-2xl border border-cyber-alert/30 shadow-[0_0_30px_rgba(239,68,68,0.05)] overflow-hidden">
                                <div className="bg-cyber-alert/10 px-6 py-4 border-b border-cyber-alert/20 flex items-center gap-3">
                                    <TriangleAlert className="w-5 h-5 text-cyber-alert animate-pulse" />
                                    <h2 className="text-lg font-bold text-cyber-alert tracking-wide">Hard Rules Tripped (Layer 1)</h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    {rules.map((rule, idx) => (
                                        <div key={idx} className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-cyber-alert/30 transition-colors">
                                            <span className="text-gray-300 font-medium tracking-wide">
                                                {rule.rule || (typeof rule === 'string' ? rule : JSON.stringify(rule))}
                                            </span>
                                            {rule.score_delta > 0 && (
                                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-cyber-alert bg-cyber-alert/10 px-2.5 py-1 rounded-full border border-cyber-alert/20 uppercase">
                                                    +{rule.score_delta} Risk Factor
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ML Explainability Layer */}
                        <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl rounded-2xl border border-cyber-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] overflow-hidden">
                            <div className="bg-cyber-primary/5 px-6 py-4 border-b border-cyber-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-cyber-primary" />
                                    <h2 className="text-lg font-bold text-cyber-primary tracking-wide">AI Inference Explainability (Layer 2)</h2>
                                </div>
                                <div className="text-xs text-cyber-primary/70 font-mono bg-cyber-primary/10 px-2 py-1 rounded">SHAP VIZ</div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-400 mb-6">XGBoost model feature attributions dictating the final probabilistic risk score.</p>

                                {shapReasons.length > 0 ? (
                                    <div className="space-y-6">
                                        {shapReasons.map((reason, idx) => {
                                            const isIncrease = reason.impact === 'increases';
                                            const widthPct = Math.max(15, 100 - (idx * 25)); // Visual descending width effect

                                            return (
                                                <div key={idx} className="relative group">
                                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                                        <span className="text-gray-200 uppercase tracking-widest text-[10px] bg-white/5 px-2 py-1 rounded">FEATURE: {reason.feature.replace(/_/g, ' ')}</span>
                                                        <span className={`text-[10px] uppercase tracking-widest flex items-center gap-1 ${isIncrease ? 'text-cyber-alert' : 'text-green-400'}`}>
                                                            {isIncrease ? 'Escalates Risk' : 'Mitigates Risk'}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${widthPct}%` }}
                                                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                                                            className={`h-full rounded-full shadow-lg ${isIncrease ? 'bg-cyber-alert shadow-cyber-alert/50' : 'bg-green-500 shadow-green-500/50'}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-500 border border-gray-800/50 rounded-xl bg-gray-900/30">
                                        <Network className="w-12 h-12 mb-4 opacity-30 text-cyber-primary" />
                                        <div className="text-sm font-medium tracking-wide">No significant SHAP explanations derived.</div>
                                        <div className="text-xs mt-1 text-gray-600">Model confidence in baseline safety is extremely high.</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Telemetry & Actions */}
                    <div className="space-y-8">

                        {/* Raw Telemetry */}
                        <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-xl p-6">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Database className="w-4 h-4" /> Node Telemetry
                            </h2>
                            <div className="space-y-4">
                                <TelemetryRow label="System Status" value={transaction.suspicious_flag ? 'Flagged Anomalous' : 'Cleared'} isAlert={transaction.suspicious_flag} />
                                <TelemetryRow label="Model Confidence" value={`${confidenceScore}%`} highlight />
                                <TelemetryRow label="Final Score Prob." value={`${finalScore} / 100`} />
                                <TelemetryRow label="Vendor Profile" value={(transaction as any).vendor_name || 'N/A'} />
                                <TelemetryRow label="Category Block" value={(transaction as any).category || 'N/A'} />
                            </div>
                        </motion.div>

                        {/* Investigator Action Center */}
                        <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-800/80 bg-gradient-to-b from-gray-800/20 to-transparent">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Resolution Center
                                </h2>

                                <div className="mb-2 text-[#6b7280] uppercase tracking-widest text-[10px] font-bold">Current Disposition</div>
                                <div className={`px-4 py-3 rounded-xl font-bold tracking-wide text-center border shadow-inner ${transaction.review_status === 'confirmed_fraud' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                    transaction.review_status === 'false_positive' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                        transaction.review_status === 'auto_cleared' ? 'bg-gray-800 border-gray-700 text-gray-300' :
                                            'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                    }`}>
                                    {transaction.review_status.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>

                            <div className="p-6 space-y-3 bg-black/20">
                                <button
                                    onClick={() => handleReview('confirmed_fraud')}
                                    disabled={reviewing || transaction.review_status === 'confirmed_fraud'}
                                    className="relative w-full py-4 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden font-bold tracking-wider text-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                                    <XCircle className="w-5 h-5" />
                                    {reviewing ? 'UPDATING DB...' : 'CONFIRM ANOMALY'}
                                </button>

                                <button
                                    onClick={() => handleReview('false_positive')}
                                    disabled={reviewing || transaction.review_status === 'false_positive'}
                                    className="relative w-full py-4 px-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 hover:border-green-500/60 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden font-bold tracking-wider text-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                                    <Activity className="w-5 h-5" />
                                    {reviewing ? 'UPDATING DB...' : 'MARK FALSE POSITIVE'}
                                </button>

                                <div className="mt-5 pt-4 text-center border-t border-gray-800/80">
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-widest">
                                        Resolutions cryptographically signed via Firebase UID & fed back into XGBoost.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

const TelemetryRow = ({ label, value, highlight = false, isAlert = false }: { label: string, value: string | number, highlight?: boolean, isAlert?: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-800/50 last:border-0 last:pb-0">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <span className={`text-sm font-semibold tracking-wide ${isAlert ? 'text-cyber-alert' :
            highlight ? 'text-cyber-primary text-xl' :
                'text-gray-200 bg-gray-900 px-2 py-0.5 rounded border border-gray-800'
            }`}>
            {value}
        </span>
    </div>
);
