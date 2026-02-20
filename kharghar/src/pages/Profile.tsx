import { useState } from 'react';
import { User, Lock, ShieldAlert, Clock, LogOut, Key, Mail, Fingerprint, Database, CheckCircle2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import Loading from '../components/Loading';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function Profile() {
  const [user] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.displayName || 'System Admin',
    email: user?.email || 'admin@commandcenter.local',
    twoFactorEnabled: true
  });

  if (!user) return <Loading />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#030712] text-gray-100 flex flex-col relative overflow-hidden">
      {/* Ambient Backgrounds */}
      <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyber-alert/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-5xl px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border-b border-gray-800 pb-6 flex justify-between items-end"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 text-white font-mono">
              <Fingerprint className="w-8 h-8 text-cyber-primary" />
              INVESTIGATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">IDENTITY</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm ml-11">Manage personnel clearance levels, API credentials, and session security.</p>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="px-6 py-2.5 bg-cyber-alert/10 hover:bg-cyber-alert/20 text-cyber-alert rounded-xl border border-cyber-alert/30 hover:border-cyber-alert/60 transition-all font-bold tracking-widest text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <LogOut className="w-4 h-4" /> TERMINATE SESSION
          </button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Profile Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden relative group p-1">
              <div className="absolute inset-0 bg-gradient-to-b from-cyber-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="bg-[#05080c] rounded-xl p-6 h-full relative z-10">

                <div className="flex flex-col items-center text-center space-y-4 mb-6 relative">
                  <div className="w-24 h-24 rounded-full bg-gray-900 border-2 border-cyber-primary flex items-center justify-center p-1 relative shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <div className="w-full h-full bg-[#0a0f16] rounded-full flex items-center justify-center border border-gray-800">
                      <User className="w-10 h-10 text-cyber-primary/80" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-[#05080c] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#05080c]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-mono tracking-wide">{userData.name}</h2>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded text-xs font-bold text-green-400 tracking-widest">
                    CLEARANCE L3
                  </div>
                </div>

                <form className="space-y-4 border-t border-gray-800/80 pt-6" onSubmit={(e) => { e.preventDefault(); setIsEditing(false); }}>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Display Alias</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userData.name}
                        disabled={!isEditing}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-200 outline-none focus:border-cyber-primary/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-mono"
                      />
                      <User className="absolute right-3 top-3 w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Comm Channel</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={userData.email}
                        disabled={!isEditing}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-200 outline-none focus:border-cyber-primary/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-mono"
                      />
                      <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">CANCEL</button>
                        <button type="submit" className="px-4 py-2 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary rounded-lg text-xs font-bold tracking-widest hover:bg-cyber-primary/20 transition-all">SAVE RECORD</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setIsEditing(true)} className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold tracking-widest transition-colors flex justify-center items-center gap-2">
                        EDIT DOSSIER
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Security & Logs */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

            {/* Security Subsystem */}
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-200 tracking-wide flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyber-primary" /> SECURITY SUBSYSTEM
                </h2>
              </div>
              <div className="p-6 space-y-6">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#05080c] rounded-xl border border-gray-800/50 gap-4">
                  <div className="flex gap-4">
                    <div className="p-2 bg-gray-900 rounded-lg shrink-0 h-fit">
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-gray-200 font-bold tracking-wide">Cryptographic Key</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.providerData[0]?.providerId === 'password'
                          ? 'Hash rotated 14 days ago. Post-quantum secure.'
                          : `Identity federated via ${user.providerData[0]?.providerId}`}
                      </p>
                    </div>
                  </div>
                  <button className="shrink-0 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold tracking-widest border border-gray-800 transition-colors w-full sm:w-auto">
                    ROTATE HASH
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#05080c] rounded-xl border border-gray-800/50 gap-4">
                  <div className="flex gap-4">
                    <div className="p-2 bg-gray-900 rounded-lg shrink-0 h-fit">
                      <ShieldAlert className={`w-5 h-5 ${userData.twoFactorEnabled ? 'text-green-400' : 'text-orange-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-gray-200 font-bold tracking-wide">Multi-Factor Enclave</h3>
                      <p className="text-xs text-gray-500 mt-1">Require TOTP hardware token for anomalous region logins.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserData({ ...userData, twoFactorEnabled: !userData.twoFactorEnabled })}
                    className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold tracking-widest border transition-colors w-full sm:w-auto flex justify-center ${userData.twoFactorEnabled
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                      }`}
                  >
                    {userData.twoFactorEnabled ? 'SECURED' : 'UNSECURED'}
                  </button>
                </div>

              </div>
            </div>

            {/* Operational Telemetry */}
            <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-200 tracking-wide flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-400" /> OPERATIONAL AUDIT LOG
                </h2>
              </div>
              <div className="p-0">
                <div className="divide-y divide-gray-800/50">
                  <AuditLogItem
                    type="ALERT"
                    message="Disposition marked [FALSE POSITIVE] on Txn #8491"
                    time="14 minutes ago"
                    ip="192.168.1.42"
                  />
                  <AuditLogItem
                    type="SYSTEM"
                    message="Invoked model retraining pipeline: XGBoost v2"
                    time="3 hours ago"
                    ip="192.168.1.42"
                  />
                  <AuditLogItem
                    type="AUTH"
                    message="Session established successfully via biometric challenge"
                    time="08:00 AM UTC"
                    ip="192.168.1.42"
                  />
                  <AuditLogItem
                    type="CONFIG"
                    message="Global preference: Threat Tolerance threshold modified to 75%"
                    time="Yesterday, 14:02 UTC"
                    ip="104.28.19.11"
                  />
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

const AuditLogItem = ({ type, message, time, ip }: { type: 'ALERT' | 'SYSTEM' | 'AUTH' | 'CONFIG', message: string, time: string, ip: string }) => {

  let typeColor = '';
  let icon = null;

  switch (type) {
    case 'ALERT': typeColor = 'text-cyber-alert'; icon = <ShieldAlert className="w-3.5 h-3.5" />; break;
    case 'AUTH': typeColor = 'text-green-400'; icon = <Lock className="w-3.5 h-3.5" />; break;
    case 'SYSTEM': typeColor = 'text-blue-400'; icon = <Database className="w-3.5 h-3.5" />; break;
    case 'CONFIG': typeColor = 'text-yellow-400'; icon = <Clock className="w-3.5 h-3.5" />; break;
  }

  return (
    <div className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-900/40 transition-colors group">
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded bg-gray-900 border border-gray-800 ${typeColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-1">{message}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          <span>{time}</span>
          <span className="w-1 h-1 rounded-full bg-gray-700"></span>
          <span>IP {ip}</span>
        </div>
      </div>
    </div>
  );
}