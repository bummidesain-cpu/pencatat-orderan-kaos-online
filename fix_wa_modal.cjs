const fs = require('fs');
let content = fs.readFileSync('src/components/WhatsAppModal.tsx', 'utf8');

content = content.replace(/    order\.remainingBalance,\n    order\.id\n  \);/g, `    order.remainingBalance\n  );`);

fs.writeFileSync('src/components/WhatsAppModal.tsx', content);
