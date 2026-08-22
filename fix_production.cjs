const fs = require('fs');
let content = fs.readFileSync('src/components/production/ProductionBoard.tsx', 'utf8');

content = content.replace(/    \{ id: 'col-1', label: 'Approved', color: 'bg-blue-500' \},\n/g, '');

content = content.replace(/          const columnOrders = orders\.filter\(\(o\) => \{\n            if \(col\.label === 'Approved'\) return o\.designApproval\.status === 'Approved' && o\.productionStage === 'Menunggu Approval';\n            if \(col\.label === 'Antrian Produksi'\) return \['Approved', 'Antrian Produksi', 'Persiapan Bahan'\]\.includes\(o\.productionStage\);\n            return o\.productionStage === col\.label;\n          \}\);/g, `          const columnOrders = orders.filter((o) => {
            if (col.label === 'Antrian Produksi') return ['Antrian Produksi', 'Persiapan Bahan'].includes(o.productionStage);
            return o.productionStage === col.label;
          });`);

fs.writeFileSync('src/components/production/ProductionBoard.tsx', content);

