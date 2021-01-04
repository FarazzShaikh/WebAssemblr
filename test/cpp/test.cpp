#include <emscripten/emscripten.h>
#include <stdint.h>
#include "../../lib/msgpack-c/include/msgpack.hpp"


struct Expression {
public:
    MSGPACK_DEFINE_MAP(a, b);
    int a;
    int b;
};

struct Arrays {
public:
    MSGPACK_DEFINE_MAP(a);
    int a[3];
};

struct ToJS {
public:
    MSGPACK_DEFINE_MAP(firstName, lastName, age, num, arr);
    std::string firstName;
    std::string lastName;
    int age;
    float num;
    int arr[4];
};


extern "C" {
    EMSCRIPTEN_KEEPALIVE int addInt(int i, int j)
    {
        return i + j;
    }

    EMSCRIPTEN_KEEPALIVE int addInt_object(char* ptr, int size)
    {

        msgpack::object_handle oh = msgpack::unpack(ptr, size);
        msgpack::object obj = oh.get();

        Expression expression;
        obj.convert(expression);

        return expression.a + expression.b;
        return 0;
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

    EMSCRIPTEN_KEEPALIVE int32_t sumArray_object(char* ptr, int size)
    {

        msgpack::object_handle oh = msgpack::unpack(ptr, size);
        msgpack::object obj = oh.get();

        Arrays arrays;
        obj.convert(arrays);

        int32_t sum = 0;
        for (int i = 0; i < 3; i++) {
            sum += arrays.a[i];
        }
        return sum;
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
        if (x == 0)
            return 0;
        int answer = 1;
        x = x % q;
        while (y > 0)
        {
            if (y & 1)
                answer = (answer * x) % q;
            y = y >> 1;
            x = (x * x) % q;
        }
        return answer;

    }

    EMSCRIPTEN_KEEPALIVE char* sendObjectToJS()
    {
        ToJS toJS;

        toJS.firstName = "Joe";
        toJS.lastName = "Smith";
        toJS.age = 4;
        toJS.num = 10.6786;
        toJS.arr[0] = 1;
        toJS.arr[1] = 2;
        toJS.arr[2] = 28;
        toJS.arr[3] = 10028;

        msgpack::sbuffer sbuf;
        msgpack::pack(sbuf, toJS);

        return sbuf.data();

    }


}
