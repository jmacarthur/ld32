# Parser for Tiled XML. Extracts the CSV-format data and any layer properties
# into a simple format intended for interpretation by Javascript games.

# All files matching the glob 'level[0-9]*.tmx' will be converted into text
# files with the same name but a .txt suffix.

import xml.etree.ElementTree as ET
import glob
import re

def processProperties(propertiesElement):
    text = ""
    for p in propertiesElement:
        text += ":%s:%s\n"%(p.attrib['name'], p.attrib['value'])
    return text

def processData(dataElement):
    lines = dataElement.text.split("\n")
    text = ""
    for l in lines:
        l = l.strip()
        if(l != ""): text += l + "\n"
    return text

def processLayer(layerElement):
    text = ""
    for e in layerElement:
        if e.tag == 'properties': text += processProperties(e)
        elif e.tag == 'data': text += processData(e)
    return text

tmxFiles = glob.glob("./level[0-9]*.tmx")
print "List of files to process: "+str(tmxFiles)
for f in tmxFiles:
    tree = ET.parse(f)
    m = re.search('level([0-9]+).tmx', f)
    levelNo = m.group(1)
    root = tree.getroot()
    for e in root:
        if e.tag == 'tileset':
            pass
        if e.tag == 'layer':
            text = processLayer(e)
    outfile = open('level%s.txt'%levelNo, 'w')
    outfile.write(text)
    outfile.close()
        
