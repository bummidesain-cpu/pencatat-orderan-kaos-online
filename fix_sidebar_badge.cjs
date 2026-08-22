const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(/                  \{item\.badge !== undefined && \(\n                    <span className=\{\`rounded-full px-2 py-0\.5 text-\[10px\] font-bold \$\{item\.badgeColor\}\`\}>\n                      \{item\.badge\}\n                    <\/span>\n                  \)\}\n/g, '');

fs.writeFileSync('src/components/Sidebar.tsx', content);

