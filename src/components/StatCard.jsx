import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading = false }) {
  // Mapping the colors to vibrant gradients that look great on white
  const colorClasses = {
    blue: 'from-blue-600 to-blue-400',
    cyan: 'from-cyan-500 to-blue-400',
    purple: 'from-purple-600 to-indigo-500',
    pink: 'from-pink-500 to-rose-400',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-semibold mb-2 tracking-wide uppercase">
            {title}
          </p>
          {loading ? (
            <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-24"></div>
          ) : (
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {value}
            </p>
          )}
        </div>
        
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl text-white shadow-lg shadow-${color}-500/20 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Subtle bottom accent line for extra polish */}
      <div className={`h-1 w-0 group-hover:w-full transition-all duration-300 rounded-full mt-4 bg-gradient-to-r ${colorClasses[color]} opacity-20`} />
    </div>
  );
}