const fs = require('fs');

let content = fs.readFileSync('src/components/orders/OrderDetailView.tsx', 'utf8');

// Remove newVersion variables
content = content.replace(/const \[newVersionNotes[\s\S]*?\];\n/, '');

// Remove handleCopyApprovalLink and handleUploadNewVersion
content = content.replace(/const approvalLink = [\s\S]*?alert\(`Desain Versi \$\{versionTag\} berhasil diunggah! Status order kembali menjadi 'Menunggu Approval'.`\);\n  };\n/g, '');

// Remove onOpenWA for approval
content = content.replace(/<button[\s\S]*?onOpenWA\(order, 'approval'\)[\s\S]*?<\/button>\n/g, '');
content = content.replace(/onOpenWA: \(order: Order, type: 'approval' \| 'nota'\) => void;/, "onOpenWA: (order: Order, type: 'nota') => void;");

// Remove Approval Tab
content = content.replace(/\{ id: 'desain' as DetailTab, label: 'DESAIN', icon: FileImage \},\n/, '');
content = content.replace(/\{ id: 'approval' as DetailTab, label: 'APPROVAL', icon: FileCheck2 \},\n/, '');

// Remove Status Approval Desain from Overview
content = content.replace(/<div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">\n\s*<span className="text-\[10px\] font-bold text-slate-400 uppercase tracking-wider">\n\s*Status Approval Desain\n\s*<\/span>[\s\S]*?<\/div>\n/g, '');

// Remove Quick Copy Approval Link Box
content = content.replace(/{\/\* Quick Copy Approval Link Box \*\/}عبير([\s\S]*?)<\/div>\n\s*<\/div>/, '');

// Actually, let's just write a regex that matches the JSX blocks
// It's safer to just do a multi_edit_file with the chunks I want to remove.
