# AIS Simulator

An AIS simulator based on AIS BlackToolkit from [Trendmicro](https://github.com/trendmicro/ais).

This code provides three GNURadio blocks. Two for AIS frame generation from a given bit string and
a websocket server to PDU message converter.

The web application let you select and compose various AIS message and performs conversion to the required bit string that is then send via websocket connection to the GNURadio backend.

Tested in the following environment:

- GnuRadio 3.10.1.1
- gr-osmosdr 0.2.0
- Ubuntu 22.04 jammy
- Python 3.10.12
- GNU C++ version 11.4; Boost 1.74.
- HackRF One (2018.01.1)

## Building

### Dependencies

You need to install the following build dependencies first:

Ubuntu 20.04 focal and earlier (Python 2 based toolchain):

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

Debian 11 bullseye / Ubuntu 22.04 jammy (Python 3 based toolchain, matches the
tested environment above):

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

### Web application

The web UI is written in TypeScript and compiled to `webapp/assets/`, which is checked into the
repository. If you edit any file under `webapp/*.ts`, rebuild the compiled output before testing
in a browser:

```
npm run build
```

## How to run

1. Start AIS simulator `$ python3 -u ais-simulator.py`
2. Open ./webapp/ais-simulator.html in browser.
3. Select AIS message type, modify parameters and send message...

Tested against [rtl_ais](https://github.com/dgiardini/rtl-ais), Comar Systems CSA300
and Saab R5A class A AIS transponder via over the air transmission.

### Command line options

Run `python3 ais-simulator.py --help` for the full list. The most commonly used options:

| Option | Description | Default |
| --- | --- | --- |
| `--channel {A,B}` | AIS channel: A = 161.975MHz (87B), B = 162.025MHz (88B) | `A` |
| `--addr` | Websocket server listen address | `0.0.0.0` |
| `--port` | Websocket server listen port | `52002` |
| `--sampling_rate` | Sampling rate, must be at least 2x the bit rate | `8000000` |
| `--bit_rate` | Bit rate in Baud | `9600` |
| `-a` | Enable RF amp | disabled |
| `-l GAIN` | IF (LNA) gain, 0-47 dB | `10` |
| `-p PPM` | Frequency correction in ppm | `0` |

#### License

Copyright 2020-2024, Mictronics

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 3
of the License, or any later version.
