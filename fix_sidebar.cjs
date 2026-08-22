const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// replace actionCounts with unpaidCount
content = content.replace(/  actionCounts,\n/, '  unpaidCount = 0,\n');

content = content.replace(/      badge: actionCounts\.pendingApproval > 0 \? actionCounts\.pendingApproval : undefined,\n/, '');
content = content.replace(/      badge: actionCounts\.readyProduction > 0 \? actionCounts\.readyProduction : undefined,\n/, '');

content = content.replace(/        \{\/\* Action Priority Summary Widget \*\/\}\n        <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200\/80 dark:bg-slate-800\/60 dark:border-slate-700\/60 text-xs">\n          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1\.5">\n            <Clock className="h-3\.5 w-3\.5 text-amber-500" \/>\n            Tindakan Cepat\n          <\/p>\n          <div className="space-y-1\.5 text-\[11px\]">\n            <div className="flex justify-between text-slate-600 dark:text-slate-400">\n              <span>Menunggu ACC:<\/span>\n              <span className="font-bold text-amber-600">\{actionCounts\.pendingApproval\} order<\/span>\n            <\/div>\n            <div className="flex justify-between text-slate-600 dark:text-slate-400">\n              <span>Customer Revisi:<\/span>\n              <span className="font-bold text-red-600">\{actionCounts\.revisionRequested\} order<\/span>\n            <\/div>\n            <div className="flex justify-between text-slate-600 dark:text-slate-400">\n              <span>Siap Produksi:<\/span>\n              <span className="font-bold text-emerald-600">\{actionCounts\.readyProduction\} order<\/span>\n            <\/div>\n            <div className="flex justify-between text-slate-600 dark:text-slate-400">\n              <span>Belum Lunas:<\/span>\n              <span className="font-bold text-indigo-600">\{actionCounts\.unpaid\} order<\/span>\n            <\/div>\n          <\/div>\n        <\/div>/, `        {/* Action Priority Summary Widget */}
        <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60 text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Tindakan Cepat
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Belum Lunas:</span>
              <span className="font-bold text-indigo-600">{unpaidCount} order</span>
            </div>
          </div>
        </div>`);

fs.writeFileSync('src/components/Sidebar.tsx', content);

