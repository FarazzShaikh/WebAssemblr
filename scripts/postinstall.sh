
# Install https://github.com/msgpack/msgpack-c for MessagePack deserialization
# on C++

if [ ! -d "./lib/msgpack-c/include" ]; 
then
    if [ ! -d "./lib/msgpack-c" ]; then 
        rm -rf ./lib/msgpack-c 
    fi
  git clone --single-branch --branch cpp_master https://github.com/msgpack/msgpack-c.git ./lib/msgpack-c &&
  find ./lib/msgpack-c -maxdepth 1 -mindepth 1 ! -name include -exec rm -rf {} +
fi 
