const fs = require('fs');
let content = fs.readFileSync('src/components/AboutModal.tsx', 'utf8');

content = content.replace(/              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2\.5">\n                <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0\.5" \/>\n                <div>\n                  <span className="font-extrabold text-slate-900 dark:text-white block">Approval Desain WA Link<\/span>\n                  <p className="text-\[11px\] text-slate-500">Kirim mockup visual langsung ke WhatsApp customer\.<\/p>\n                <\/div>\n              <\/div>\n/g, '');

fs.writeFileSync('src/components/AboutModal.tsx', content);
