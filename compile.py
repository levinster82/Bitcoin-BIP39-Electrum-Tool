import os
import re
import datetime
import hashlib
from io import open

# This script generates the bip39-electrum-standalone.html file.

# It removes script and style tags and replaces with the file content.

f = open('src/index.html', "r", encoding="utf-8")
page = f.read()
f.close()


# Script tags

scriptsFinder = re.compile("""<script src="(.*)"></script>""")
scripts = scriptsFinder.findall(page)

for script in scripts:
    filename = os.path.join("src", script)
    s = open(filename, "r", encoding="utf-8")
    scriptContent = "<script>%s</script>" % s.read()
    s.close()
    scriptTag = """<script src="%s"></script>""" % script
    page = page.replace(scriptTag, scriptContent)


# Style tags

stylesFinder = re.compile("""<link rel="stylesheet" href="(.*)">""")
styles = stylesFinder.findall(page)

for style in styles:
    filename = os.path.join("src", style)
    s = open(filename, "r", encoding="utf-8")
    styleContent = "<style>%s</style>" % s.read()
    s.close()
    styleTag = """<link rel="stylesheet" href="%s">""" % style
    page = page.replace(styleTag, styleContent)


# Write the standalone file

standalone_filename = 'bip39-electrum-standalone.html'
f = open(standalone_filename, 'w', encoding="utf-8")
f.write(page)
f.close()

# Generate SHA256 checksum
sha256_hash = hashlib.sha256()
with open(standalone_filename, "rb") as f:
    for chunk in iter(lambda: f.read(4096), b""):
        sha256_hash.update(chunk)

checksum = sha256_hash.hexdigest()
checksum_filename = standalone_filename + '.sha256sum'

# Write checksum file
with open(checksum_filename, 'w', encoding="utf-8") as f:
    f.write("%s  %s\n" % (checksum, standalone_filename))

print("%s - Generated %s" % (datetime.datetime.now(), standalone_filename))
print("%s - Generated %s" % (datetime.datetime.now(), checksum_filename))
print("SHA256: %s" % checksum)
