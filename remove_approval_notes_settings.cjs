const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

content = content.replace(/            <div>\n              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Peringatan Form Approval Customer<\/label>\n              <textarea\n                rows=\{2\}\n                value=\{formData\.approvalNotes\}\n                onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, approvalNotes: e\.target\.value \}\)\}\n                className="mt-1 w-full rounded-xl border border-slate-200 p-2\.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"\n              \/>\n            <\/div>\n/g, '');

fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
