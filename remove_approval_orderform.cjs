const fs = require('fs');

let content = fs.readFileSync('src/components/orders/OrderFormModal.tsx', 'utf8');

content = content.replace(/      designApproval: \{\n        token: approvalToken,\n        status: 'Menunggu Approval',\n        currentVersion: 'V1',\n        versions: \[\],\n        history: \[\n          \{\n            timestamp: new Date\(\)\.toISOString\(\),\n            actor: userRole === 'owner' \? 'Owner' : 'Sales Admin',\n            action: 'Draft Order Dibuat',\n          \},\n        \],\n      \},/g, '');

content = content.replace(/    const approvalToken = generateApprovalToken\(\);/g, '');
content = content.replace(/  generateApprovalToken,/g, '');
content = content.replace(/              <span>SIMPAN ORDER & BUAT APPROVAL LINK<\/span>/g, '              <span>SIMPAN ORDER</span>');

// Replace status Menunggu Approval
content = content.replace(/      status: 'Menunggu Approval'/g, "      status: 'Produksi'");
content = content.replace(/      productionStage: 'Menunggu Approval'/g, "      productionStage: 'Antrian Produksi'");

fs.writeFileSync('src/components/orders/OrderFormModal.tsx', content);

