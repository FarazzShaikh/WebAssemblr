# Compile Library
rollup -c &&
# Copy over logo
cp ./cli/bin/logo.txt ./cli/dist/ &&
# Delete Compiled files
rm -rf ./lib/web/*/ &&
rm -rf ./lib/node/*/ &&
# Test WebAssemblr
jest
