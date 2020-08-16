# AIS Simulator

An AIS simulator based on AIS BlackToolkit from [Trendmicro](https://github.com/trendmicro/ais).

Tested in the following environment:

- GnuRadio 3.8.1
- gr-osmosdr 0.2.0
- Ubuntu 20.04 focal
- Python 3.8
- GNU C++ version 9.3.0; Boost 1.71.
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

### Build & Installation

See [README](gr-ais_simulator/README.md) on how to build and install the custom GnuRadio block.

## How to run

See short description in each file's header.

#### License

Copyright 2020, Mictronics

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or any later version.
