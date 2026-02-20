import { useState } from 'react';
import { Shield, Bell, User, Lock, X, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    riskThreshold: 75,
    twoFactor: false,
    whitelist: ['Trusted Vendor Inc', 'Secure Supplies Co']
  });

  const [newWhitelist, setNewWhitelist] = useState('');

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 relative overflow-hidden pb-12">
      {/* Ambient Backgrounds */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-8 py-8 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pb-6 border-b border-white/5"
        >
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 text-white font-mono">
            <Sliders className="w-8 h-8 text-cyber-primary" />
            GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">PREFERENCES</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm ml-11">Configure detection thresholds and security tolerances.</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-8">
              {/* Notification Settings */}
              <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800/80 flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyber-primary" />
                  <h2 className="text-lg font-bold text-gray-200 tracking-wide">Alert Routing</h2>
                </div>
                <div className="p-6">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <div className="text-gray-200 font-medium mb-1">Real-time Fraud Telemetry</div>
                      <div className="text-xs text-gray-500">Push immediate alerts for High and Critical severity events.</div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={settings.notifications}
                        onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-cyber-primary/40' : 'bg-gray-800'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifications ? 'translate-x-4 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </motion.div>

              {/* Security Settings */}
              <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800/80 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-bold text-gray-200 tracking-wide">Threat Tolerance</h2>
                </div>
                <div className="p-6 space-y-8">
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <label className="block text-gray-200 font-medium mb-1">Engine Risk Threshold</label>
                        <div className="text-xs text-gray-500">Scores above this percentage trigger automatic quarantines.</div>
                      </div>
                      <span className="text-2xl font-black text-orange-400 font-mono bg-orange-500/10 px-3 py-1 rounded border border-orange-500/20">
                        {settings.riskThreshold}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.riskThreshold}
                      onChange={(e) => setSettings({ ...settings, riskThreshold: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-2">
                      <span>Lenient (50%)</span>
                      <span>Strict (100%)</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-800/80">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div>
                        <div className="text-gray-200 font-medium mb-1">MFA Verification</div>
                        <div className="text-xs text-gray-500">Require multi-factor auth for investigator disposition changes.</div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={settings.twoFactor}
                          onChange={(e) => setSettings({ ...settings, twoFactor: e.target.checked })}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.twoFactor ? 'bg-orange-500/40' : 'bg-gray-800'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.twoFactor ? 'translate-x-4 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Whitelist Management */}
            <motion.div variants={itemVariants} className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-gray-200 tracking-wide">Trusted Vendors</h2>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-gray-400 mb-6">Profiles listed here bypass Layer 1 rules and receive a weighted reduction in final ML probability scores.</p>

                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Vendor Name or Auth Token..."
                    className="flex-1 bg-[#05080c] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-green-500/50 transition-colors placeholder:text-gray-600 focus:ring-1 focus:ring-green-500/20"
                    value={newWhitelist}
                    onChange={(e) => setNewWhitelist(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newWhitelist) {
                        setSettings({ ...settings, whitelist: [...settings.whitelist, newWhitelist] });
                        setNewWhitelist('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newWhitelist) {
                        setSettings({ ...settings, whitelist: [...settings.whitelist, newWhitelist] });
                        setNewWhitelist('');
                      }
                    }}
                    className="px-6 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold tracking-wider text-sm rounded-xl border border-green-500/30 hover:border-green-500/60 transition-colors"
                  >
                    WHITELIST
                  </button>
                </div>

                <div className="space-y-2 flex-1 relative overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                  {settings.whitelist.map((vendor, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      key={index}
                      className="flex items-center justify-between bg-black/40 border border-gray-800/80 hover:border-gray-700 px-4 py-3 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300">{vendor}</span>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          whitelist: settings.whitelist.filter((_, i) => i !== index)
                        })}
                        className="text-gray-600 hover:text-cyber-alert transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  {settings.whitelist.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      No trusted vendors configured.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}