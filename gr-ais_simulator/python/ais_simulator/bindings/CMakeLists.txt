# Copyright 2020 Free Software Foundation, Inc.
#
# This file is part of GNU Radio
#
# SPDX-License-Identifier: GPL-3.0-or-later
#

########################################################################
# Check if there is C++ code at all
########################################################################
if(NOT ais_simulator_sources)
    MESSAGE(STATUS "No C++ sources... skipping python bindings")
    return()
endif(NOT ais_simulator_sources)

########################################################################
# Check for pygccxml
########################################################################
GR_PYTHON_CHECK_MODULE_RAW(
    "pygccxml"
    "import pygccxml"
    PYGCCXML_FOUND
    )

include(GrPybind)

########################################################################
# Python Bindings
########################################################################

list(APPEND ais_simulator_python_files
    bitstring_to_frame_python.cc
    websocket_pdu_python.cc
    python_bindings.cc)

GR_PYBIND_MAKE_OOT(ais_simulator
   ../../..
   gr::ais_simulator
   "${ais_simulator_python_files}")

# copy bindings extension for use in QA test module
add_custom_command(TARGET ais_simulator_python POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:ais_simulator_python>
    ${PROJECT_BINARY_DIR}/test_modules/gnuradio/ais_simulator/
)

install(TARGETS ais_simulator_python DESTINATION ${GR_PYTHON_DIR}/gnuradio/ais_simulator COMPONENT pythonapi)
