const fs = require('fs');

let path = 'e:/mama laptop backup/CareerLens AI/frontend/src/components/ResumeManager.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace interface
content = content.replace(/interface ResumeRecord \{[\s\S]*?\n\}/, '');

// add import
content = content.replace(
  'import { ResumeAnalysisViewer } from "./ResumeAnalysisViewer"',
  'import { ResumeAnalysisViewer } from "./ResumeAnalysisViewer"\nimport { useResumes, type ResumeRecord } from "../hooks/useResumes"'
);

// replace state variables inside ResumeManager
content = content.replace(
  'const [resumes, setResumes] = useState<ResumeRecord[]>([])\n  const [loading, setLoading] = useState(true)',
  'const { resumes, loading } = useResumes()'
);

// remove useEffect and loadResumes
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?async function loadResumes\(\) \{[\s\S]*?finally \{\n      setLoading\(false\)\n    \}\n  \}/, '');

// remove loadResumes() calls
content = content.replaceAll('loadResumes() // Refresh list', '// loadResumes() not needed with onSnapshot');
content = content.replaceAll('await loadResumes() // refresh after delete', '');
content = content.replaceAll('loadResumes() // refresh to update status', '');
content = content.replaceAll('loadResumes()', '');

fs.writeFileSync(path, content);
console.log('ResumeManager updated!');
