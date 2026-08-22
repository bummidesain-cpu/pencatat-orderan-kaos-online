const fs = require('fs');
let content = fs.readFileSync('src/lib/utils.ts', 'utf8');

// Remove generateWAApprovalUrl completely
content = content.replace(/\/\*\*[\s\S]*?generateWAApprovalUrl[\s\S]*?return `https:\/\/wa\.me\/\$\{cleanPhone\}\?text=\$\{encodeURIComponent\(text\)\}`;\n\}\n/g, '');

// Clean up generateWAInvoiceUrl
content = content.replace(/  approvalToken: string,\n  baseUrl: string = window\.location\.origin/g, '');
content = content.replace(/  const invoiceUrl = `\$\{baseUrl\}\/approval\/\$\{approvalToken\}`;\n/g, '');
content = content.replace(/\\n\\nAnda dapat melihat detail nota & approval desain pada link berikut:\\n\$\{invoiceUrl\}/g, '');

// Remove generateApprovalToken completely
content = content.replace(/\/\*\*[\s\S]*?generateApprovalToken[\s\S]*?\n\}\n/g, '');

fs.writeFileSync('src/lib/utils.ts', content);
