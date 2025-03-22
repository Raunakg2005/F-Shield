// src/pages/Profile.tsx
import { useState } from 'react';
import { User, Lock, ShieldAlert, Clock, LogOut, Key, Mail } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Navbar from '../components/Navbar';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'CyberSec User',
    email: 'secure@business.com',
    twoFactorEnabled: false
  });

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100">
      {/* Navigation Bar */}
      <Navbar />

      <main className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-cyber-primary mb-8 flex items-center gap-3">
          <User className="w-8 h-8" />
          Account Profile
        </h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
            <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-cyber-primary" />
                </div>
                <button className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition">
                  Change Avatar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField 
                  label="Full Name"
                  value={userData.name}
                  icon={<User className="w-4 h-4" />}
                  editable={isEditing}
                  onChange={(v) => setUserData({...userData, name: v})}
                />
                <InfoField
                  label="Email"
                  value={userData.email}
                  icon={<Mail className="w-4 h-4" />}
                  editable={isEditing}
                  onChange={(v) => setUserData({...userData, email: v})}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
                <button className="px-4 py-2 bg-cyber-alert/20 text-cyber-alert rounded-lg hover:bg-cyber-alert/30 transition">
                  <LogOut className="inline mr-2 w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
            <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Security Settings
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-cyber-dark rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-cyber-primary" />
                  <div>
                    <h3 className="text-cyber-primary">Password</h3>
                    <p className="text-sm text-gray-400">Last changed 3 days ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition">
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-cyber-dark rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyber-primary" />
                  <div>
                    <h3 className="text-cyber-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400">
                      {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUserData({...userData, twoFactorEnabled: !userData.twoFactorEnabled})}
                  className={`px-4 py-2 rounded-lg transition ${
                    userData.twoFactorEnabled 
                      ? 'bg-green-400/20 text-green-400 hover:bg-green-400/30' 
                      : 'bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/30'
                  }`}
                >
                  {userData.twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="p-4 bg-cyber-dark rounded-lg">
                <h3 className="text-cyber-primary mb-4 flex items-center gap-2">
                  <GoogleLoginButton />
                  Connected Accounts
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-gray-400">No accounts connected</p>
                  </div>
                  <button className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition">
                    Connect Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
            <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </h2>
            
            <div className="space-y-4">
              <ActivityLogItem 
                icon={<ShieldAlert className="w-4 h-4" />}
                title="Password Changed"
                timestamp="2 hours ago"
              />
              <ActivityLogItem
                icon={<User className="w-4 h-4" />}
                title="Profile Updated"
                timestamp="1 day ago"
              />
              <ActivityLogItem
                icon={<LogOut className="w-4 h-4" />}
                title="Logged in from new device"
                timestamp="3 days ago"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Components
const InfoField = ({ label, value, icon, editable, onChange }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  editable: boolean;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm text-cyber-primary flex items-center gap-2">
      {icon}
      {label}
    </label>
    {editable ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2 text-cyber-primary"
      />
    ) : (
      <p className="bg-cyber-dark p-2 rounded-lg border border-cyber-primary/20">{value}</p>
    )}
  </div>
);

const ActivityLogItem = ({ icon, title, timestamp }: {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 hover:border-cyber-primary/40 transition">
    <div className="flex items-center gap-3">
      <span className="text-cyber-primary">{icon}</span>
      <span>{title}</span>
    </div>
    <span className="text-sm text-gray-400">{timestamp}</span>
  </div>
);