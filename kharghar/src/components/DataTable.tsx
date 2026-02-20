import { Transaction } from '../types';
import { Link } from 'react-router-dom';

interface DataTableProps {
  transactions: Transaction[];
}

export default function DataTable({ transactions }: DataTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        No transactions found. Upload a CSV to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[600px]">
      <table className="min-w-full divide-y divide-gray-700 relative">
        <thead className="sticky top-0 bg-cyber-dark z-10">
          <tr>
            <th className="p-4 text-left font-semibold text-cyber-primary">ID</th>
            <th className="p-4 text-left font-semibold text-cyber-primary">Date</th>
            <th className="p-4 text-left font-semibold text-cyber-primary">Amount</th>
            <th className="p-4 text-left font-semibold text-cyber-primary">Risk Level</th>
            <th className="p-4 text-left font-semibold text-cyber-primary">Status</th>
            <th className="p-4 text-left font-semibold text-cyber-primary">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
              <td className="p-4 text-gray-300">#{tx.id}</td>
              <td className="p-4 text-gray-400 text-sm">
                {new Date(tx.timestamp).toLocaleString()}
              </td>
              <td className="p-4 font-mono text-gray-200">₹{tx.amount?.toFixed(2)}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs capitalize ${tx.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                  tx.risk_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    tx.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                  }`}>
                  {tx.risk_level}
                </span>
                {tx.suspicious_flag && <span className="ml-2 text-cyber-alert">⚠️</span>}
              </td>
              <td className="p-4">
                <span className={`text-xs ${tx.review_status === 'confirmed_fraud' ? 'text-red-400' :
                  tx.review_status === 'false_positive' ? 'text-green-400' :
                    tx.review_status === 'needs_review' ? 'text-orange-400' :
                      'text-gray-400'
                  }`}>
                  {tx.review_status.replace('_', ' ')}
                </span>
              </td>
              <td className="p-4">
                <Link
                  to={`/transactions/${tx.id}`}
                  className="text-cyber-primary hover:text-cyber-primary/80 text-sm font-medium transition-colors"
                >
                  View Details &rarr;
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
