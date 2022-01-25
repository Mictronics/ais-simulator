# AIS Simulator

An AIS simulator based on AIS BlackToolkit from [Trendmicro](https://github.com/trendmicro/ais).

This code provides three GNURadio blocks. Two for AIS frame generation from a given bit string and
a websocket server to PDU message converter.

The web application let you select and compose various AIS message and performs conversion to the required bit string that is then send via websocket connection to the GNURadio backend.

Tested in the following environment:

- GnuRadio 3.8.2 & 3.8.5
- gr-osmosdr 0.2.0
- Ubuntu 20.04 focal
- Debian 11 bullseye
- Python 3.8 & 3.9.2
- GNU C++ version 9.3.0; Boost 1.71.
- GNU C++ version 10.2.1; Boost 1.74.
- HackRF One (2018.01.1)

## Building

### Dependencies

You need to install the following build dependencies first:

```
sudo apt-get install -y \
    cmake \
    autoconf \
    libtool \
    pkg-config \
    build-essential \
    python-docutils \
    libcppunit-dev \
    swig \
    doxygen \
    python-scipy \
    python-gtk2 \
    gnuradio-dev \
    gr-osmosdr \
    libosmocore-dev
```

Debian 11 bullseye:

```
sudo apt-get install -y \
    cmake \
    autoconf \
    libtool \
    pkg-config \
    build-essential \
    python3-docutils \
    libcppunit-dev \
    swig \
    doxygen \
    python3-scipy \
    gnuradio-dev \
    gr-osmosdr \
    libosmocore-dev
```

### Build & Installation

See [README](gr-ais_simulator/README.md) on how to build and install the custom GnuRadio block.

Note: gr-ais_simulator blocks need to rebuild and installed after GnuRadio toolchain update.

## How to run

1. Start AIS simulator `$ python3 -u ais-simulator.py`
2. Open ./webapp/ais-simulator.html in browser.
3. Select AIS message type, modify parameters and send message...

Tested against [rtl_ais](https://github.com/dgiardini/rtl-ais) and Comar Systems CSA300
class A AIS transponder via over the air transmission.

#### License

Copyright 2020, Mictronics

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or any later version.
