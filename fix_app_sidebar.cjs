const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/          currentUser=\{currentUser\}\n        \/>/, `          userRole={currentUser.role}
          unpaidCount={orders.filter(o => o.paymentStatus !== 'Lunas').length}
          businessName={settings.businessName}
          logoUrl={settings.logoUrl}
        />`);

fs.writeFileSync('src/App.tsx', content);
