#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE int c_addInt(int i, int j)
{
    return i + j;
}

EMSCRIPTEN_KEEPALIVE int c_multiplyInt(int i, int j)
{
    return i * j;
}


EMSCRIPTEN_KEEPALIVE double c_fact(int i)
{
    double n = 1;
    for (; i > 0; i--)
    {
        n *= i;
    }
    return n;
}

EMSCRIPTEN_KEEPALIVE char* c_getString()
{
    static char str[] = "Hello, WASM!";
    return str;
}

