const fs = require('fs');
let content = fs.readFileSync('src/lib/utils.ts', 'utf8');

content = content.replace(/export function getDeadlineInfo\(deadline: string, completedStatus\?: string\): \{ status: string; daysRemaining: number; isOverdue: boolean; badgeClass: string \} \{/g, `export function getDeadlineInfo(deadline: string, isCompleted: boolean = false): { status: string; daysRemaining: number; isOverdue: boolean; badgeClass: string } {`);
content = content.replace(/  if \(completedStatus === 'Selesai' \|\| completedStatus === 'Diambil\/Dikirim'\) \{/g, `  if (isCompleted) {`);

fs.writeFileSync('src/lib/utils.ts', content);
