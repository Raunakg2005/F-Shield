import { Alert } from "../types";

export const AlertCard = ({ title, amount, status, reason, date }: Alert) => (
  <div className="p-4 bg-gray-900/50 rounded-lg border border-cyber-alert/20 hover:border-cyber-alert/40 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-cyber-alert font-medium">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{amount} • {new Date(date).toLocaleDateString()}</p>
        <p className="text-xs text-gray-500 mt-1">{reason}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 ${status === 'Critical' ? 'bg-cyber-alert/10' : 'bg-yellow-400/10'} text-cyber-alert text-sm rounded-full`}>
          {status}
        </span>
        <button className="px-4 py-2 bg-cyber-alert/20 text-cyber-alert rounded-lg hover:bg-cyber-alert/30 transition-colors">
          Investigate
        </button>
      </div>
    </div>
  </div>
);