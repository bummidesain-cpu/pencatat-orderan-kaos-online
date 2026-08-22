const fs = require('fs');
let content = fs.readFileSync('src/components/orders/OrderListView.tsx', 'utf8');

content = content.replace(/  const filteredOrders = orders\.filter\(\(o\) => \{/, "  const [filterPayment, setFilterPayment] = useState<string>('all');\n  const [filterProduction, setFilterProduction] = useState<string>('all');\n  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);\n\n  const filteredOrders = orders.filter((o) => {");

fs.writeFileSync('src/components/orders/OrderListView.tsx', content);
