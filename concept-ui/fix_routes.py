import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Replace the closing paren `)}` of the replaced routes with `} />`
# We know the opening is `<Route path=... element={`
# The block ends with `)}` at the same indent.

lines = content.split('\n')
in_routes = False
for i, line in enumerate(lines):
    if '<Routes>' in line:
        in_routes = True
    elif '</Routes>' in line:
        in_routes = False
    
    if in_routes:
        # If line is exactly `        )}` or `        )}` (with 8 spaces or 10 spaces)
        if re.match(r'^\s*\)\}$', line):
            lines[i] = line.replace(')}', '} />')

# Also remove the duplicate `<Routes>` tag
new_lines = []
routes_count = 0
for line in lines:
    if '<Routes>' in line:
        routes_count += 1
        if routes_count > 1:
            continue
    new_lines.append(line)

with open('src/App.jsx', 'w') as f:
    f.write('\n'.join(new_lines))

