const fs = require('fs');
let prepPath = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/InterviewPrep.tsx';
let content = fs.readFileSync(prepPath, 'utf8');

// detailed breakdown header
content = content.replaceAll(
  'className="font-bold text-slate-800 tracking-wider uppercase text-sm mb-4"',
  'className="font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase text-sm mb-4"'
);

// the left side metric labels (Technical Accuracy, Relevance, etc)
content = content.replaceAll(
  'className="text-sm font-semibold text-slate-600"',
  'className="text-sm font-semibold text-slate-600 dark:text-slate-300"'
);

// good points and missing points LI items text
content = content.replaceAll(
  'className="text-sm text-slate-700 leading-relaxed font-medium flex gap-2"',
  'className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex gap-2"'
);

// better approach paragraph
content = content.replaceAll(
  'className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line"',
  'className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line"'
);

// better approach header
content = content.replaceAll(
  'className="font-bold text-blue-800 flex items-center gap-2 tracking-wide text-sm uppercase"',
  'className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 tracking-wide text-sm uppercase"'
);

// also let's check border-slate-50 border-dotted
content = content.replaceAll(
  'className="flex items-center justify-between pb-3 border-b border-slate-50 border-dotted last:border-none"',
  'className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800 border-dotted last:border-none"'
);

// also look at the borders globally
content = content.replaceAll(
  'border-slate-100',
  'border-slate-100 dark:border-slate-800'
);

// fixing start voice button in dark mode
content = content.replaceAll(
  'className="w-full sm:w-auto h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold"',
  'className="w-full sm:w-auto h-12 px-8 gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-full font-semibold"'
);

// fix Interview tab top right mode labels
content = content.replaceAll(
  'className="font-bold text-slate-800"',
  'className="font-bold text-slate-800 dark:text-slate-200"'
);

fs.writeFileSync(prepPath, content);
console.log('UI Fixes Done');
