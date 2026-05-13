import re

def find_closing_paren(text, start_idx):
    count = 1
    for i in range(start_idx + 1, len(text)):
        if text[i] == '(':
            count += 1
        elif text[i] == ')':
            count -= 1
            if count == 0:
                return i
    return -1

with open('src/App.jsx', 'r') as f:
    content = f.read()

main_start = content.find("<main ref={containerRef}")
main_end = content.find("</main>", main_start)

if main_start == -1 or main_end == -1:
    print("Could not find main tag")
    exit(1)

routes_map = {
    'glossary': '/glossary',
    'quran': '/quran',
    'duas': '/duas',
    'ziyarats': '/ziyarats',
    'library': '/kisa-academy',
    'hadith': '/hadith',
    'home': '/',
    'search': '/search'
}

# We iterate through the mappings, from the end to the start so offsets don't get messed up.
# First, collect all matches:
matches = []
for tab, path in routes_map.items():
    search_str = f"{{activeTab === '{tab}' && ("
    idx = content.find(search_str, main_start, main_end)
    if idx != -1:
        paren_idx = idx + len(search_str) - 1 # Points to the '('
        close_idx = find_closing_paren(content, paren_idx)
        if close_idx != -1:
            matches.append({
                'tab': tab,
                'path': path,
                'start_idx': idx,
                'paren_idx': paren_idx,
                'close_idx': close_idx,
                'search_str': search_str
            })

# Sort matches descending by start_idx
matches.sort(key=lambda x: x['start_idx'], reverse=True)

new_content = content
for m in matches:
    # First replace the closing `)}` with `} />`
    # We know close_idx points to `)`, and it should be followed by `}`.
    # Let's verify:
    next_char_idx = new_content.find('}', m['close_idx'])
    if next_char_idx != -1:
        # replace from close_idx to next_char_idx+1 with `} />`
        new_content = new_content[:m['close_idx']] + '} />' + new_content[next_char_idx+1:]
    
    # Then replace opening
    replacement_open = f'<Route path="{m["path"]}" element={{'
    new_content = new_content[:m['start_idx']] + replacement_open + new_content[m['paren_idx'] + 1:]

# Now wrap everything inside <main> with <Routes>
# Also we need to add <Route path="/admin" element={<KisaCommandCenter />} />
# And <Route path="/kisa-academy/library/:series?/:episode?" element={<TranscriptLibrary ... />} />
admin_route = """
          <Route path="/admin" element={<KisaCommandCenter />} />
          <Route path="/kisa-academy/library/:series?/:episode?" element={
            <TranscriptLibrary 
                transcripts={transcriptData}
                vaultItems={vaultItems}
                externalDocTarget={transcriptTarget}
                externalHighlightTarget={transcriptHighlight}
                theme={theme}
                setTheme={setTheme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleHomeClick={handleHomeClick}
                showHistoryDrawer={showHistoryDrawer}
                setShowHistoryDrawer={setShowHistoryDrawer}
                appHistory={appHistory}
                setAppHistory={setAppHistory}
                handleHistoryClick={handleHistoryClick}
                showUpdates={showUpdates}
                setShowUpdates={setShowUpdates}
                showInfo={showInfo}
                setShowInfo={setShowInfo}
                user={user}
                setShowAuthModal={setShowAuthModal}
                setShowSignOutConfirm={setShowSignOutConfirm}
                setShowVault={setShowVault}
                setQuranTarget={setQuranTarget}
                setQuranVerseTarget={setQuranVerseTarget}
                APP_UPDATES={APP_UPDATES}
                timeAgo={timeAgo}
                KisaLogo={KisaLogo}
            />
          } />
          <Route path="/kisa-academy/courses" element={<CourseLibrary />} />
"""

# Recompute main bounds
main_start = new_content.find("<main ref={containerRef}")
main_end = new_content.find("</main>", main_start)

# Insert <Routes> wrapper
open_tag_end = new_content.find('>', main_start) + 1
new_content = new_content[:open_tag_end] + "\n        <Routes>" + new_content[open_tag_end:main_end] + admin_route + "        </Routes>\n      " + new_content[main_end:]

with open('src/App.jsx', 'w') as f:
    f.write(new_content)
print("Done")
