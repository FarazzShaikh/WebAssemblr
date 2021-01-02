#include <emscripten/emscripten.h>
#include <stdint.h>

extern "C" {
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

    EMSCRIPTEN_KEEPALIVE float* cpp_doubleArray(float* input, int buffSize)
    {

        for (int i = 0; i < buffSize; i++) {
            input[i] *= 2;
        }

        return input;
    }

    EMSCRIPTEN_KEEPALIVE int** doubl_2D(int** input, int buffSizeX, int buffSizeY)
    {
        int** output;
        output = new int* [buffSizeX];

        for (int x = 0; x < buffSizeX; x++) {
            output[x] = new int[buffSizeY];
            for (int y = 0; y < buffSizeY; y++) {
                output[x][y] = input[x][y] * 2;
            }
        }

        return output;
    }

}
