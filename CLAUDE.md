# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AIS Simulator: a tool to compose and transmit fake AIS (Automatic Identification System, maritime
vessel tracking) messages over SDR hardware, for testing/research purposes. Based on the AIS
BlackToolkit. Three parts, each with its own toolchain:

1. **`webapp/`** — TypeScript browser UI. User selects an AIS message type and fills in
   parameters; the page encodes the parameters into an AIVDM bit string and sends it over a
   WebSocket.
2. **`ais-simulator.py`** (repo root) — GNURadio flowgraph ("top_block") run as a standalone
   Python script. Hosts the WebSocket server, converts the incoming bit string PDU into an RF
   frame, GMSK-modulates it, and transmits via an `osmosdr` sink (e.g. HackRF).
3. **`gr-ais_simulator/`** — out-of-tree GNURadio C++ module providing the two custom blocks used
   by `ais-simulator.py`: `websocket_pdu` (WebSocket server → PDU) and `bitstring_to_frame`
   (bit string → HDLC/AIS frame with NRZI encoding, framing, CRC).

Data flow: browser UI → `AivdmEncoder` (bit string) → WebSocket → `websocket_pdu` block → PDU →
`bitstring_to_frame` block → GMSK modulator → SDR sink → RF.

## Building & running

### Web UI (TypeScript)

```
npm run build          # tsc --build; compiles webapp/*.ts -> webapp/assets/*.js
```

Source files are listed explicitly in `tsconfig.json` (`webapp/ais-simulator.ts`,
`webapp/aivdm_encoder.ts`, plus `.d.ts` declaration files). Compiled output (with source maps)
goes to `webapp/assets/`; that directory is checked in, so rebuild it after editing any `.ts`
file. Linting follows `tslint.json` (extends `tslint:recommended`; max line length 250, namespaces
allowed, bitwise ops allowed).

Both `.ts` files use a single `namespace aisSimulator { ... }` (see `webapp/types.d.ts` for the
shared interfaces: `IAisParameter`, `IVessel`, `IRoute`, `INavPoint`, form element collection).
There is no module bundler/npm package graph — this is classic namespaced TypeScript compiled
straight to script tags loaded by `webapp/ais-simulator.html`.

### GNURadio C++ block (`gr-ais_simulator/`)

Requires GNURadio 3.10 dev headers installed. See `gr-ais_simulator/README.md` for
distro-specific `apt-get` dependency lists (differs between generic instructions and Debian 11).

```
cd gr-ais_simulator
mkdir build && cd build
cmake ../ -Wno-dev \
  -DPYTHON_EXECUTABLE:FILEPATH=/usr/bin/python3.10 \
  -DPYTHON_INCLUDE_DIR:PATH=/usr/include/python3.10 \
  -DPYTHON_LIBRARY:FILEPATH=/usr/lib/x86_64-linux-gnu/libpython3.10.so
make
sudo make install
```

Must be rebuilt and reinstalled after any GNURadio toolchain upgrade. If Python fails to find the
module (`ImportError: No module named ais_simulator`), fix `PYTHONPATH`/`LD_LIBRARY_PATH` and run
`ldconfig` as documented in `gr-ais_simulator/README.md`.

Standard GNURadio OOT module layout:
- `lib/*_impl.cc` / `lib/*_impl.h` — block implementations
- `include/gnuradio/ais_simulator/*.h` — public block interfaces (`make()` factory pattern)
- `python/ais_simulator/bindings/` — pybind11 bindings (`bind_oot_file.py` regenerates these from
  the headers via `gr_modtool`; don't hand-edit the generated `*_python.cc` files without checking
  `failed_conversions.txt`)
- `grc/*.block.yml` — GNU Radio Companion block definitions for the flowgraph editor
- `apps/`, `examples/` — example flowgraphs (`.grc`)

`enable_testing()` is set in the top-level `CMakeLists.txt` but there are no test sources in this
repo currently — there is no `ctest` suite to run.

### Running the simulator end-to-end

```
python3 -u ais-simulator.py     # starts the WebSocket server + GNURadio flowgraph/SDR TX
```

Then open `webapp/ais-simulator.html` directly in a browser (no dev server needed) and compose/send
a message. Key `ais-simulator.py` CLI flags: `--channel {A,B}` (161.975/162.025 MHz), `--port`
(WebSocket listen port, default 52002), `--addr` (listen address), `--sampling_rate`, `--bit_rate`,
`-a` (RF amp), `-l` (LNA gain), `-p` (ppm freq correction).

## Adding a new AIS message type

Touches three places that must stay in sync:
1. `webapp/types.d.ts` — extend `IAisParameter` with any new fields.
2. `webapp/aivdm_encoder.ts` — add an `encodeMsgTypeNN` method and a `case` in
   `AivdmEncoder.encodeMsg`'s switch; also extend `encoderTest()`'s sample parameters used to
   sanity-check bitstream length against the ITU-R M.1371 spec (cf.
   https://gpsd.gitlab.io/gpsd/AIVDM.html).
3. `webapp/ais-simulator.html` / `webapp/ais-simulator.ts` — add form fields and wire them into
   the form element collection.

The GNURadio blocks themselves (`bitstring_to_frame`, `websocket_pdu`) are message-type-agnostic —
they operate on raw bit strings/frames and don't need changes for new AIS message types.

## Verifying changes

- Bit-manipulation logic in `gr-ais_simulator/lib/*.cc` (byte swaps, CRC reversal, NRZI) is easy to
  misjudge by reading alone — a "redundant" reversal may be cancelling out a later one elsewhere in
  the pipeline. Verify numerically (e.g. CRC-16/X.25's magic residual 0xF0B8) before treating it as
  a bug.
- ASan/UBSan (`g++ -fsanitize=address,undefined`) is effective for checking the C++ blocks' manual
  malloc/memcpy sizing. GCC `-O3 -Wstringop-overflow` has thrown a false positive on inlined,
  runtime-bounded loops here — confirm with ASan before trusting the warning.
- For `/code-review`, prefer per-directory targets (`webapp/`, `gr-ais_simulator/lib`,
  `ais-simulator.py`) at `medium` effort over `high .` on the whole repo, which has stalled
  (spawns multiple finder agents; one can hang 600s+).
