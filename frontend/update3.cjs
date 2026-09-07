const fs = require('fs');

const file = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/ResumeAnalysisViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Work Experience bullets
content = content.replaceAll(
  'text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium',
  'text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium'
);

// 2. Empty experience card
content = content.replaceAll(
  'text-slate-600 dark:text-slate-400 font-medium bg-slate-50',
  'text-[15px] text-slate-700 dark:text-slate-300 font-medium bg-slate-50'
);

// 3. Projects description
content = content.replaceAll(
  'text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1',
  'text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4 flex-1'
);

// 4. Extracurriculars description
content = content.replaceAll(
  'text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium',
  'text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium'
);

// 5. Feedback descriptions
content = content.replaceAll(
  'text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed',
  'text-slate-700 dark:text-slate-200 font-medium text-[15px] leading-relaxed'
);
content = content.replaceAll(
  'text-slate-700 dark:text-slate-300 font-medium text-sm',
  'text-slate-700 dark:text-slate-200 font-medium text-[15px]'
);

// 6. Section headers (make them bolder)
content = content.replaceAll(
  'text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest',
  'text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest'
);

// 7. Small labels below scores
content = content.replaceAll(
  'text-[11px] font-bold text-green-700 uppercase tracking-wider',
  'text-xs font-black text-green-700 uppercase tracking-wider'
);
content = content.replaceAll(
  'text-[11px] font-bold text-amber-700 uppercase tracking-wider',
  'text-xs font-black text-amber-700 uppercase tracking-wider'
);
content = content.replaceAll(
  'text-[11px] font-bold text-blue-700 uppercase tracking-wider',
  'text-xs font-black text-blue-700 uppercase tracking-wider'
);
content = content.replaceAll(
  'text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
  'text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider'
);

fs.writeFileSync(file, content);
console.log('Typography strings modified!');
