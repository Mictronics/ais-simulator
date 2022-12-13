find_package(PkgConfig)

PKG_CHECK_MODULES(PC_GR_AIS_SIMULATOR gnuradio-ais_simulator)

FIND_PATH(
    GR_AIS_SIMULATOR_INCLUDE_DIRS
    NAMES gnuradio/ais_simulator/api.h
    HINTS $ENV{AIS_SIMULATOR_DIR}/include
        ${PC_AIS_SIMULATOR_INCLUDEDIR}
    PATHS ${CMAKE_INSTALL_PREFIX}/include
          /usr/local/include
          /usr/include
)

FIND_LIBRARY(
    GR_AIS_SIMULATOR_LIBRARIES
    NAMES gnuradio-ais_simulator
    HINTS $ENV{AIS_SIMULATOR_DIR}/lib
        ${PC_AIS_SIMULATOR_LIBDIR}
    PATHS ${CMAKE_INSTALL_PREFIX}/lib
          ${CMAKE_INSTALL_PREFIX}/lib64
          /usr/local/lib
          /usr/local/lib64
          /usr/lib
          /usr/lib64
          )

include("${CMAKE_CURRENT_LIST_DIR}/gnuradio-ais_simulatorTarget.cmake")

INCLUDE(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(GR_AIS_SIMULATOR DEFAULT_MSG GR_AIS_SIMULATOR_LIBRARIES GR_AIS_SIMULATOR_INCLUDE_DIRS)
MARK_AS_ADVANCED(GR_AIS_SIMULATOR_LIBRARIES GR_AIS_SIMULATOR_INCLUDE_DIRS)
