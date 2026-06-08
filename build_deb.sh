#!/bin/bash
set -e

# Temporary directory for debian build
BUILD_DIR="/tmp/fichior-deb-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR/opt/fichior"
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/pixmaps"
mkdir -p "$BUILD_DIR/usr/share/applications"

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "Error: 'dist' directory not found. Please run 'npm run build' first."
  exit 1
fi

# 1. Create Control file
cat << 'EOF' > "$BUILD_DIR/DEBIAN/control"
Package: fichior
Version: 1.0.0
Section: utils
Priority: optional
Architecture: all
Maintainer: nouhailler <nouhailler@github.com>
Depends: nodejs (>= 18), npm
Description: Premium File Manager with Natural Language Search and automation
EOF

# 2. Create Post-Install script
cat << 'EOF' > "$BUILD_DIR/DEBIAN/postinst"
#!/bin/bash
set -e
echo "Configuring Fichior..."
cd /opt/fichior
npm install --omit=dev
chmod +x /usr/bin/fichior
echo "Fichior installed successfully!"
EOF
chmod 755 "$BUILD_DIR/DEBIAN/postinst"

# 3. Create Runner script
cat << 'EOF' > "$BUILD_DIR/usr/bin/fichior"
#!/bin/bash
cd /opt/fichior
node server.js > /dev/null 2>&1 &
disown
exit 0
EOF
chmod 755 "$BUILD_DIR/usr/bin/fichior"

# 4. Create Desktop shortcut pointing to the new icon
cat << 'EOF' > "$BUILD_DIR/usr/share/applications/fichior.desktop"
[Desktop Entry]
Name=Fichior
Comment=Gestionnaire de fichiers intelligent
Exec=fichior
Icon=/usr/share/pixmaps/fichior.png
Terminal=false
Type=Application
Categories=System;Utility;
EOF

# 5. Copy files (excluding node_modules, hidden files, git databases)
cp -r db.js index.html indexer.js natural_language.js package.json package-lock.json server.js versions.js watchdog.js dist/ "$BUILD_DIR/opt/fichior/"

# Copy icon image to pixmaps folder
cp fichior_icon.png "$BUILD_DIR/usr/share/pixmaps/fichior.png"

# 6. Build the debian package
dpkg-deb --build "$BUILD_DIR" fichior_1.0.0_all.deb

echo "Debian package successfully built: fichior_1.0.0_all.deb with application icon"
rm -rf "$BUILD_DIR"
