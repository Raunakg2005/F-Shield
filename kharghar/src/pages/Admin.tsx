import { useState, useEffect } from 'react';
import { Shield, Activity, RefreshCw, Server, Database, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Admin() {
    const [healthData, setHealthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await api.fraud.health();
                setHealthData(res);
            } catch (e) {
                console.error("Failed to load model health");
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 relative overflow-hidden pb-12">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-20%] left-[50%] w-[600px] h-[600px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />

            <div className="container mx-auto max-w-6xl px-6 py-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 pb-6 border-b border-white/5"
                >
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 text-white font-mono">
                        <Server className="w-8 h-8 text-cyber-primary" />
                        SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">ADMINISTRATION</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm ml-11">Manage ML model inference health, nodes, and global strict blocklists.</p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {/* Model Health Panel */}
                    <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl border border-cyber-primary/20 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.05)] overflow-hidden">
                        <div className="bg-cyber-primary/5 px-6 py-4 border-b border-cyber-primary/20 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-cyber-primary flex items-center gap-2 font-mono">
                                <Activity className="w-5 h-5" /> INFERENCE HEALTH
                            </h2>
                            <Cpu className="w-5 h-5 text-cyber-primary/50" />
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="animate-pulse flex flex-col gap-4">
                                    <div className="h-20 bg-gray-900/50 rounded-xl"></div>
                                    <div className="h-24 bg-gray-900/50 rounded-xl"></div>
                                </div>
                            ) : healthData ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-gray-900/50 p-5 rounded-xl border border-gray-800 shadow-inner">
                                        <div>
                                            <span className="block text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Status</span>
                                            <span className="text-2xl font-black text-green-400">
                                                {healthData.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <div className="text-right border-l border-gray-800 pl-6">
                                            <span className="block text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Avg Confidence (7d)</span>
                                            <span className="text-2xl font-mono text-gray-200">
                                                {(healthData.avg_confidence_7d || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-gray-900/80 to-black p-5 rounded-xl border border-gray-800 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                                            <span className="text-gray-500 font-medium">Model architecture</span>
                                            <span className="font-mono text-cyber-primary">XGBoost + Isotonic Calibrated</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                                            <span className="text-gray-500 font-medium">Model version</span>
                                            <span className="font-mono text-gray-300">v2.1.0-stratified</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500 font-medium">Last retrained</span>
                                            <span className="text-gray-400 font-mono">48 hours ago</span>
                                        </div>
                                    </div>

                                    <button className="relative w-full py-4 px-4 bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 hover:border-cyber-primary/60 rounded-xl transition-all flex justify-center items-center gap-2 group overflow-hidden font-bold tracking-wider text-sm mt-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                                        <RefreshCw className="w-4 h-4" />
                                        TRIGGER RETRAINING PIPELINE
                                    </button>
                                </div>
                            ) : (
                                <div className="text-cyber-alert p-4 bg-cyber-alert/10 border border-cyber-alert/20 rounded-lg text-center font-mono text-sm">
                                    FAILED TO ESTABLISH CONNECTION TO INFERENCE ENGINE.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* System Blacklists Panel */}
                    <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl border border-cyber-alert/20 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.05)] overflow-hidden flex flex-col">
                        <div className="bg-cyber-alert/10 px-6 py-4 border-b border-cyber-alert/20 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-cyber-alert flex items-center gap-2 font-mono">
                                <Shield className="w-5 h-5" /> GLOBAL BLOCKLISTS
                            </h2>
                            <Database className="w-5 h-5 text-cyber-alert/50" />
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <p className="text-sm text-gray-400 mb-6">Vendors and geolocations enforced here instantly trigger <span className="text-cyber-alert font-bold">Critical Severity (Layer 1)</span> halts across all multi-tenant nodes.</p>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blacklist Vendor Node</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Vendor ID or Name..."
                                            className="flex-1 bg-[#05080c] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyber-alert/50 transition-colors placeholder:text-gray-600 focus:ring-1 focus:ring-cyber-alert/20"
                                        />
                                        <button className="px-6 py-3 font-bold tracking-wider text-sm bg-cyber-alert/10 text-cyber-alert hover:bg-cyber-alert/20 border border-cyber-alert/30 hover:border-cyber-alert/60 rounded-lg transition-all">
                                            ENFORCE
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Block High-Risk Geolocation</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="ISO Code (e.g. RU, KP, IR)..."
                                            className="flex-1 bg-[#05080c] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyber-alert/50 transition-colors placeholder:text-gray-600 focus:ring-1 focus:ring-cyber-alert/20"
                                        />
                                        <button className="px-6 py-3 font-bold tracking-wider text-sm bg-cyber-alert/10 text-cyber-alert hover:bg-cyber-alert/20 border border-cyber-alert/30 hover:border-cyber-alert/60 rounded-lg transition-all">
                                            ENFORCE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">Active Enforcement</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded text-gray-300 border border-gray-800">14 VENDORS</span>
                                    <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded text-gray-300 border border-gray-800">3 REGIONS</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
