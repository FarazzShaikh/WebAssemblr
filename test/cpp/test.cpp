#include <emscripten/emscripten.h>
#include <stdint.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE int addInt(int i, int j)
    {
        return i + j;
    }

    EMSCRIPTEN_KEEPALIVE int multiplyInt(int i, int j)
    {
        return i * j;
    }


    EMSCRIPTEN_KEEPALIVE double factorial(int i)
    {
        long long n = 1;
        for (; i > 0; i--)
        {
            n *= i;
        }
        return (double)n;
    }

    EMSCRIPTEN_KEEPALIVE float* doubleArray(float* input, int buffSize)
    {

        for (int i = 0; i < buffSize; i++) {
            input[i] *= 2;
        }

        return input;
    }

    EMSCRIPTEN_KEEPALIVE int32_t sumArray(int32_t* input, int buffSize)
    {

        int32_t sum = 0;
        for (int i = 0; i < buffSize; i++) {
            sum += input[i];
        }

        return sum;
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

    EMSCRIPTEN_KEEPALIVE int modularExponentiation(int x, uint32_t y, int q)
    {
        if(x == 0)
            return 0;
        int answer = 1;
        x = x%q;
        while(y > 0)
        {
            if(y & 1)
                answer = (answer*x)%q;
            y = y >> 1;
            x = (x*x)%q;
        }
        return answer;
        
    }


}
