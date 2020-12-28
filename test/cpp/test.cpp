#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE int cpp_addInt(int i, int j)
{
    return i + j;
}

EMSCRIPTEN_KEEPALIVE int cpp_multiplyInt(int i, int j)
{
    return i * j;
}


EMSCRIPTEN_KEEPALIVE double cpp_fact(int i)
{
    long long n = 1;
    for (; i > 0; i--)
    {
        n *= i;
    }
    return (double)n;
}

