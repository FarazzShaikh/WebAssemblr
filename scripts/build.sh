# Compile Library
rollup -c &&
# Copy over logo
cp ./bin/logo.txt ./lib/node/bin/ &&
# Delete Compiled files
rm -rf ./lib/web/*/ &&
rm -rf ./lib/node/bin/*/ &&
find ./lib/node -maxdepth 1 -mindepth 1 ! -name bin -type d -exec rm -rf {} + &&
# Test WebAssemblr
jest
