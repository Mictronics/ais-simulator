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

```
$ mkdir build
$ cd build
$ cmake ../ -Wno-dev -DPYTHON_EXECUTABLE:FILEPATH=/usr/bin/python3.8 -DPYTHON_INCLUDE_DIR:PATH=/usr/include/python3.8 -DPYTHON_LIBRARY:FILEPATH=/usr/lib/x86_64-linux-gnu/libpython3.8.so
$ make
$ sudo make install
```

On Debian 11 bullseye or other system with python 3.9 replace `3.8` with `3.9`.

In case of `ImportError: No module named ais_simulator` set LD_LIBRARY_PATH:

```
export PYTHONPATH=/usr/local/lib/python3/dist-packages:/usr/local/lib/python3/site-packages:$PYTHONPATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
sudo ldconfig
```

#### License

Copyright 2022, Mictronics

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or any later version.
