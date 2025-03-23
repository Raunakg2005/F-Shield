import { Transaction } from '../types';

interface DataTableProps {
  transactions: Transaction[];
}

export default function DataTable({ transactions }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="p-4 text-left">ID</th>
            <th className="p-4 text-left">Date</th>
            <th className="p-4 text-left">Vendor</th>
            <th className="p-4 text-left">Amount</th>
            <th className="p-4 text-left">Risk Level</th>
            <th className="p-4 text-left">Category</th>
            <th className="p-4 text-left">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="p-4">{tx.id}</td>
              <td className="p-4">{tx.date}</td>
              <td className="p-4">{tx.vendor}</td>
              <td className="p-4">${tx.amount.toFixed(2)}</td>
              <td className="p-4 capitalize">{tx.riskLevel}</td>
              <td className="p-4">{tx.category}</td>
              <td className="p-4">
                {tx.ipCountry} → {tx.vendorCountry}
                {tx.ipCountry !== tx.vendorCountry && (
                  <span className="ml-2 text-cyber-alert">🌍</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
