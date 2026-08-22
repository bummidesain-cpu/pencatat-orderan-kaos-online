const fs = require('fs');
let content = fs.readFileSync('src/lib/utils.ts', 'utf8');

const additional = `
export function formatCategoryName(category: string): string {
  if (category === 'kaosPolo') return 'Kaos Polo';
  if (category === 'kaosLenganPanjang') return 'Lengan Panjang';
  if (category === 'kaosLenganPendek') return 'Lengan Pendek';
  return category;
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export function getDeadlineInfo(deadline: string): { status: string; daysRemaining: number } {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'Terlambat', daysRemaining: diffDays };
  if (diffDays === 0) return { status: 'Hari Ini', daysRemaining: diffDays };
  return { status: \`\${diffDays} Hari Lagi\`, daysRemaining: diffDays };
}
`;

content += additional;

fs.writeFileSync('src/lib/utils.ts', content);
