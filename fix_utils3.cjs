const fs = require('fs');
let content = fs.readFileSync('src/lib/utils.ts', 'utf8');

content = content.replace(/export function getDeadlineInfo\(deadline: string\): \{ status: string; daysRemaining: number \} \{[\s\S]*?\n\}/, `export function getDeadlineInfo(deadline: string, completedStatus?: string): { status: string; daysRemaining: number; isOverdue: boolean; badgeClass: string } {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (completedStatus === 'Selesai' || completedStatus === 'Diambil/Dikirim') {
    return { status: 'Selesai', daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-emerald-100 text-emerald-700' };
  }

  if (diffDays < 0) return { status: 'Terlambat', daysRemaining: diffDays, isOverdue: true, badgeClass: 'bg-red-100 text-red-700' };
  if (diffDays === 0) return { status: 'Hari Ini', daysRemaining: diffDays, isOverdue: true, badgeClass: 'bg-red-100 text-red-700' };
  if (diffDays <= 3) return { status: \`\${diffDays} Hari Lagi\`, daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-amber-100 text-amber-700' };
  return { status: \`\${diffDays} Hari Lagi\`, daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-slate-100 text-slate-700' };
}`);

fs.writeFileSync('src/lib/utils.ts', content);
