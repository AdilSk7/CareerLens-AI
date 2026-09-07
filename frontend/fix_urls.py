import os

src_dir = r'e:\mama laptop backup\CareerLens AI\frontend\src'

# The broken pattern: VITE_API_BASE_URL || followed by more nested expressions
# We just need to replace any line containing the mangled nested pattern with a clean one

count = 0
for root, _, files in os.walk(src_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            lines = fh.readlines()

        changed = False
        new_lines = []
        for line in lines:
            # If line contains our mangled OR-chain, rewrite only the URL portion
            if 'VITE_API_BASE_URL ||' in line:
                import re
                # Replace the entire nested mess up to the closing /api... with clean version
                fixed = re.sub(
                    r'`\$\{import\.meta\.env\.VITE_API_BASE_URL(?:[^`]*?)\}',
                    '`${import.meta.env.VITE_API_BASE_URL}',
                    line
                )
                if fixed != line:
                    changed = True
                    line = fixed
            new_lines.append(line)

        if changed:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.writelines(new_lines)
            count += 1
            print('Fixed:', os.path.relpath(path, src_dir))

print('Done. Fixed', count, 'files.')
