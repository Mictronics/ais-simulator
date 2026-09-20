This directory contains custom blocks for GnuRadio that are called AIS Simulator.

Two blocks serve as generator of AIS frames and implements the full AIS stack.
It is composed of three main components covering respectively the
application/presentation layers, the link layer and the physical layer,
as defined in the protocol specification for AIS.

A websocket server to PDU message converter block accepts AIS bit strings from an external source,
convert and output a message.

Based on and contains work from:

https://github.com/trendmicro/ais

https://github.com/gercap/ais

### Build and installation:

Point `PYTHON_EXECUTABLE`/`PYTHON_INCLUDE_DIR`/`PYTHON_LIBRARY` at whichever Python 3 you run
`ais-simulator.py` with (e.g. `/usr/bin/python3.10` or `/usr/bin/python3.12`):

```
$ mkdir build
$ cd build
$ cmake ../ -Wno-dev -DPYTHON_EXECUTABLE:FILEPATH=/usr/bin/python3.12 -DPYTHON_INCLUDE_DIR:PATH=/usr/include/python3.12 -DPYTHON_LIBRARY:FILEPATH=/usr/lib/x86_64-linux-gnu/libpython3.12.so
$ make
$ sudo make install
```

If `build/` was previously configured for a different Python version, `rm -rf build` first — CMake
caches the detected Python module extension (e.g. `.cpython-310-...so`) in `CMakeCache.txt` on
first configure and does not recompute it on a later `cmake` re-run just because
`PYTHON_EXECUTABLE` changed. A stale cache builds a `.so` tagged for the old Python ABI that gets
installed into the new interpreter's `dist-packages`, where it's silently invisible (the `except
ModuleNotFoundError: pass` in `python/ais_simulator/__init__.py` swallows the failed import) —
Python then reports `AttributeError: module 'gnuradio.ais_simulator' has no attribute
'websocket_pdu'` instead of a clear import error.

In case of `ImportError: No module named ais_simulator` set LD_LIBRARY_PATH:

```
export PYTHONPATH=/usr/local/lib/python3/dist-packages:/usr/local/lib/python3/site-packages:$PYTHONPATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
sudo ldconfig
```

#### License

Copyright 2022-2024, Mictronics

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or any later version.
