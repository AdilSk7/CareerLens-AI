import re

file_path = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/ResumeAnalysisViewer.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

injection_code = '''              )}
              
             {/* PROJECTS */}
             {safeList(analysis.projects).length > 0 && (
               <div className="mt-10">
                 <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-4">Notable Projects</h3>
                 <div className="grid gap-4 md:grid-cols-2">
                   {safeList(analysis.projects).map((proj, i) => (
                     <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 flex flex-col h-full">
                       <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{proj.name}</h4>
                       <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{proj.description}</p>
                       <div className="flex flex-wrap gap-1.5 mt-auto">
                         {safeList(proj.technologies).map((tech: string, idx: number) => (
                           <Badge key={idx} className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[10px]">{tech}</Badge>
                         ))}
                       </div>
                     </Card>
                   ))}
                 </div>
               </div>
             )}
             
             {/* EXTRACURRICULARS */}
             {safeList(analysis.extracurricular_activities).length > 0 && (
               <div className="mt-10">
                 <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2 mb-4">Extracurriculars & Leadership</h3>
                 <div className="space-y-4">
                   {safeList(analysis.extracurricular_activities).map((extra, i) => (
                     <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 dark:border-l-indigo-600">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                         <div>
                           <h4 className="font-bold text-slate-900 dark:text-slate-100">{extra.role}</h4>
                           <p className="text-indigo-700 dark:text-indigo-400 font-medium text-sm">{extra.organization}</p>
                         </div>
                         <Badge className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 self-start">{extra.duration}</Badge>
                       </div>
                       <ul className="space-y-2 mt-3">
                         {safeList(extra.description).map((desc: string, idx: number) => (
                           <li key={idx} className="flex items-start gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                             <span className="text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0">•</span> {desc}
                           </li>
                         ))}
                       </ul>
                     </Card>
                   ))}
                 </div>
               </div>
             )}
          </div>'''

pattern = r'(?<=No professional experience listed on this resume\. Projects and academic experience may be available in the Skills or Education sections\.\n                </Card>\n              \)\})\s+</div>'

new_content = re.sub(pattern, '\n' + injection_code, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced successfully" if len(new_content) != len(content) else "Regex didn't match anything")
