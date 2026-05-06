CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -std=c11

build/test_scenarios: test_scenarios.c scenarios.h
	@mkdir -p build
	$(CC) $(CFLAGS) -o $@ test_scenarios.c

.PHONY: test clean
test: build/test_scenarios
	./build/test_scenarios

clean:
	rm -rf build
