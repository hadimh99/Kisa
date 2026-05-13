import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# We know the order of components. Let's just find them by regex matching.
def get_block(name):
    pattern = f"{{activeTab === '{name}' && \\((.*?)\\n        \\)\\}}"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

glossary = get_block('glossary')
quran = get_block('quran')
duas = get_block('duas')
ziyarats = get_block('ziyarats')
library = get_block('library')
hadith = get_block('hadith')
home = get_block('home')

# search is a bit more complex because it has multiple activeTab === 'search' blocks
# Actually, the search block inside <main> starts with:
search_start = content.find("{activeTab === 'search' && (")
# and ends with... actually it's very long. 
# But wait! If I just wrap the entire children of `<main>` in `<Routes>`, how do I handle `activeTab === 'search'`?
# The search UI in App.jsx is embedded directly in App.jsx (it's not a separate component).

# What if I just use a custom router inside `<main>`?
# "Implement <Routes> for the following semantic paths: `/` -> `Home.jsx`, `/quran` -> `QuranReader.jsx`"
# The user wants me to use the `<Routes>` component.

# Let's replace only the known components with `<Route path=... element={...} />`.
# And we can wrap the entire inside of `<main>` in `<Routes>`? 
# If we wrap it all in `<Routes>`, the `activeTab === 'search' && (...)` block would need to be inside a `<Route path="/search" element={...} />`.
