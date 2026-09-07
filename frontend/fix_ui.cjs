const fs = require('fs');

// Fix ResumeAnalysisViewer Job Snapshot styling
let viewPath = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/ResumeAnalysisViewer.tsx';
let viewContent = fs.readFileSync(viewPath, 'utf8');
viewContent = viewContent.replaceAll(
  'text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto',
  'text-[15px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto'
);
fs.writeFileSync(viewPath, viewContent);

// Fix Mock Interview Dropdowns
let prepPath = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/InterviewPrep.tsx';
let prepContent = fs.readFileSync(prepPath, 'utf8');
prepContent = prepContent.replaceAll(
  'className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none"',
  'className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none dark:text-slate-200"'
);
prepContent = prepContent.replaceAll(
  'className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2 text-sm outline-none font-medium text-slate-700"',
  'className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm outline-none font-medium text-slate-700 dark:text-slate-200"'
);
prepContent = prepContent.replaceAll(
  'className="text-2xl font-bold text-slate-900"',
  'className="text-2xl font-bold text-slate-900 dark:text-slate-100"'
);
prepContent = prepContent.replaceAll(
  'className="text-2xl font-bold text-slate-900 mb-3 text-center"',
  'className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 text-center"'
);
prepContent = prepContent.replaceAll(
  'className="flex flex-col items-center justify-center p-8 space-y-6 bg-slate-50 rounded-lg border border-slate-200"',
  'className="flex flex-col items-center justify-center p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800"'
);
prepContent = prepContent.replaceAll(
  'className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm"',
  'className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"'
);
prepContent = prepContent.replaceAll(
  'className="text-slate-500 max-w-md mx-auto"',
  'className="text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto"'
);
prepContent = prepContent.replaceAll(
  'className="text-slate-500 text-center max-w-md mb-8 leading-relaxed"',
  'className="text-slate-600 dark:text-slate-400 font-medium text-center max-w-md mb-8 leading-relaxed"'
);
fs.writeFileSync(prepPath, prepContent);
console.log('UI Fixes Done');
