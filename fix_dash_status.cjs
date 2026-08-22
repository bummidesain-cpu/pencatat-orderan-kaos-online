const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');

content = content.replace(/                        order\.status === 'Revisi Requested'\n                          \? 'bg-red-100 text-red-700'\n                          : order\.status === 'Menunggu Approval'\n                          \? 'bg-amber-100 text-amber-700'\n                          : 'bg-indigo-100 text-indigo-700'/g, `                        order.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'`);

fs.writeFileSync('src/components/dashboard/DashboardView.tsx', content);
