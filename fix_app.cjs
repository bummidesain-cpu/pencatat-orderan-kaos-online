const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = content.replace(/import \{ PublicApprovalView \} from '\.\/components\/approval\/PublicApprovalView';\n/, '');

// States
content = content.replace(/  const \[waModalType, setWaModalType\] = useState<'approval' \| 'nota'>\('approval'\);\n/g, "  const [waModalType, setWaModalType] = useState<'nota'>('nota');\n");

// Path checking
content = content.replace(/  \/\/ Check URL pathname for Public Customer Approval Token\n  const isApprovalPath = pathname\.startsWith\('\/approval\/'\);\n  const approvalToken = isApprovalPath \? pathname\.replace\('\/approval\/', ''\) : null;\n/g, "");

// Approval handlers
content = content.replace(/  \/\/ Public Approval Handlers[\s\S]*?  \/\/ IF PUBLIC APPROVAL URL IS ACCESSED STANDALONE\n/g, '  // IF PUBLIC APPROVAL URL IS ACCESSED STANDALONE\n');

// URL routing
content = content.replace(/  \/\/ IF PUBLIC APPROVAL URL IS ACCESSED STANDALONE[\s\S]*?    <\/div>\n  \);\n/g, '');

// Quick stats
content = content.replace(/    pendingApproval: orders\.filter\(\(o\) => o\.designApproval\.status === 'Menunggu Approval'\)\.length,\n/g, '');
content = content.replace(/    revisionRequested: orders\.filter\(\(o\) => o\.designApproval\.status === 'Revisi Requested'\)\.length,\n/g, '');
content = content.replace(/    readyProduction: orders\.filter\(\(o\) => o\.designApproval\.status === 'Approved' && o\.productionStage === 'Menunggu Approval'\)\.length,\n/g, '');

content = content.replace(/                <div className="flex items-center justify-between text-xs font-semibold">\n                  <span className="text-amber-300">Menunggu ACC:<\/span>\n                  <span className="text-white">\{quickStats\.pendingApproval\}<\/span>\n                <\/div>\n/g, '');
content = content.replace(/                <div className="flex items-center justify-between text-xs font-semibold">\n                  <span className="text-red-300">Perlu Revisi:<\/span>\n                  <span className="text-white">\{quickStats\.revisionRequested\}<\/span>\n                <\/div>\n/g, '');
content = content.replace(/                <div className="flex items-center justify-between text-xs font-semibold">\n                  <span className="text-emerald-300">Ready Produksi:<\/span>\n                  <span className="text-white">\{quickStats\.readyProduction\}<\/span>\n                <\/div>\n/g, '');

content = content.replace(/onOpenWA=\{\(order, type\) => \{\n            setSelectedOrder\(order\);\n            setWaModalType\(type\);\n            setIsWaModalOpen\(true\);\n          \}\}/g, 'onOpenWA={(order, type) => {\n            setSelectedOrder(order);\n            setWaModalType(type);\n            setIsWaModalOpen(true);\n          }}');


fs.writeFileSync('src/App.tsx', content);

