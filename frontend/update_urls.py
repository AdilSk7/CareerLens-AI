import os
import re

src_dir = 'e:/mama laptop backup/CareerLens AI/frontend/src'
count = 0

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            if 'http://127.0.0.1:8000' in content:
                # Replace backtick usage
                content = content.replace('`http://127.0.0.1:8000', '`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}')
                
                # Replace double quote usage
                content = content.replace('"http://127.0.0.1:8000', '`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}')
                
                # Replace single quote usage
                content = content.replace("'http://127.0.0.1:8000", '`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}')
                
                # Fix trailing quotes if it was a plain string literal converted to a template literal
                # For `\"http://127.0.0.1:8000/api/endpoint\"` ->   \" -> ``
                content = re.sub(r'(\`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| "http://127\.0\.0\.1:8000"\}[^\"]*?)\"', r'\1`', content)
                content = re.sub(r'(\`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| "http://127\.0\.0\.1:8000"\}[^\']*?)\'', r'\1`', content)
                
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                count += 1

print(f'Updated {count} files.')
