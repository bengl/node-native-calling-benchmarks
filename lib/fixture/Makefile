UNAME_S := $(shell uname -s)

CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -std=c11 -fPIC -fvisibility=hidden

ifeq ($(UNAME_S),Darwin)
  EXT := dylib
  LDFLAGS := -dynamiclib
else
  EXT := so
  LDFLAGS := -shared
endif

LIB := build/ffi_test_library.$(EXT)

$(LIB): fixture.c ../native/scenarios.h
	@mkdir -p build
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ fixture.c

.PHONY: all clean
all: $(LIB)

clean:
	rm -rf build
