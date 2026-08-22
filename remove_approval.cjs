const fs = require('fs');

let content = fs.readFileSync('src/components/orders/OrderDetailView.tsx', 'utf8');

// We just do string replacement
// 1. the new version states
content = content.replace(/  \/\/ New Version Upload State\n  const \[newVersionNotes, setNewVersionNotes\] = useState\(''\);\n  const \[newVersionFileUrl, setNewVersionFileUrl\] = useState\(\n    'https:\/\/images.unsplash.com\/photo-1583743814966-8936f5b7be1a\?auto=format&fit=crop&q=80&w=800'\n  \);\n/g, '');

// 2. the approval link
content = content.replace(/  const approvalLink = `\$\{window\.location\.origin\}\/approval\/\$\{order\.designApproval\.token\}`;\n\n  const handleCopyApprovalLink = \(\) => \{\n    navigator\.clipboard\.writeText\(approvalLink\);\n    setCopiedLink\(true\);\n    setTimeout\(\(\) => setCopiedLink\(false\), 2000\);\n  \};\n/g, '');

// 3. handleUploadNewVersion
content = content.replace(/  \/\/ Upload New Design Version[\s\S]*?alert\(`Desain Versi \$\{versionTag\} berhasil diunggah! Status order kembali menjadi 'Menunggu Approval'\.`\);\n  \};\n/g, '');

// 4. the tabs
content = content.replace(/    \{ id: 'desain' as DetailTab, label: 'DESAIN', icon: FileImage \},\n/g, '');
content = content.replace(/    \{ id: 'approval' as DetailTab, label: 'APPROVAL', icon: FileCheck2 \},\n/g, '');

// 5. types
content = content.replace(/  \| 'desain'\n  \| 'approval'\n/g, '\n');
content = content.replace(/  onOpenWA: \(order: Order, type: 'approval' \| 'nota'\) => void;/g, "  onOpenWA: (order: Order, type: 'nota') => void;");

// 6. the approval button
content = content.replace(/          <button\n            onClick=\{\(\) => onOpenWA\(order, 'approval'\)\}\n            className="inline-flex items-center gap-1\.5 rounded-xl bg-emerald-600 px-3\.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"\n          >\n            <MessageSquare className="h-4 w-4" \/>\n            <span>Kirim WA Approval<\/span>\n          <\/button>\n\n/g, '');

// 7. Status Approval Desain card
content = content.replace(/            <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">\n              <span className="text-\[10px\] font-bold text-slate-400 uppercase tracking-wider">\n                Status Approval Desain\n              <\/span>[\s\S]*?            <\/div>\n\n/g, '');

// 8. Quick Copy Approval Link Box
content = content.replace(/          \{\/\* Quick Copy Approval Link Box \*\/\}[\s\S]*?<\/div>\n          <\/div>\n\n/g, '');

// 9. TAB 4 and TAB 5
content = content.replace(/      \{\/\* TAB 4: DESAIN & VERSION CONTROL \*\/\}[\s\S]*?      \{\/\* TAB 6: PEMBAYARAN \*\/\}/g, '      {/* TAB 6: PEMBAYARAN */}');

// 10. Also fix productionStage options
content = content.replace(/              <option value="Menunggu Approval">Menunggu Approval<\/option>\n              <option value="Approved">Approved<\/option>\n/g, '');

fs.writeFileSync('src/components/orders/OrderDetailView.tsx', content);

