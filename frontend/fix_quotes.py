import os, re

src_dir = r'e:\mama laptop backup\CareerLens AI\frontend\src'
count = 0
for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, encoding='utf-8') as file:
                content = file.read()
            original = content
            
            # Find mixed strings like: `string'
            content = re.sub(r'`([A-Za-z0-9_/\-]+)\'', r"'\1'", content)
            
            # Find mixed strings like: 'string`
            content = re.sub(r'\'([A-Za-z0-9_/\-]+)`', r"'\1'", content)
            
            if content != original:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                count += 1
                print(f'Fixed {f}')
print('Total files fixed:', count)
