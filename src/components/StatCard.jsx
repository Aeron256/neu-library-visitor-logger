import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading = false }) {
  const colorClasses = {
    blue: 'from-neu-blue to-neu-cyan',
    cyan: 'from-neu-cyan to-neu-blue',
    purple: 'from-neu-purple to-neu-blue',
    pink: 'from-pink-500 to-rose-500',
  };

  return (
    <div className="bg-dark-900 rounded-lg border border-dark-800 p-6 hover:border-dark-700 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-dark-400 text-sm font-medium mb-2">{title}</p>
          {loading ? (
            <div className="h-8 bg-dark-800 rounded animate-pulse w-24"></div>
          ) : (
            <p className="text-3xl font-bold text-white">{value}</p>
          )}
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-lg text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
