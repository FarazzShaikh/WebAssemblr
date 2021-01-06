# Compile Library
rollup -c &&
# Compile CLI
cd cli && npm install && npm run build && cd .. &&
# Copy over logo
cp ./cli/bin/logo.txt ./cli/dist/ &&
# Delete Compiled files
rm -rf ./lib/web/*/ &&
rm -rf ./lib/node/*/ &&
# Test WebAssemblr
jest
