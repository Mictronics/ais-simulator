/* -*- c++ -*- */

#define AIS_SIMULATOR_API

%include "gnuradio.i"           // the common stuff

//load generated python docstrings
%include "ais_simulator_swig_doc.i"

%{
#include "ais_simulator/build_frame.h"
#include "ais_simulator/bitstring_to_frame.h"
#include "ais_simulator/websocket_pdu.h"
%}

%include "ais_simulator/build_frame.h"
GR_SWIG_BLOCK_MAGIC2(ais_simulator, build_frame);
%include "ais_simulator/bitstring_to_frame.h"
GR_SWIG_BLOCK_MAGIC2(ais_simulator, bitstring_to_frame);
%include "ais_simulator/websocket_pdu.h"
GR_SWIG_BLOCK_MAGIC2(ais_simulator, websocket_pdu);
