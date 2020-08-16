INCLUDE(FindPkgConfig)
PKG_CHECK_MODULES(PC_AIS_SIMULATOR ais_simulator)

FIND_PATH(
    AIS_SIMULATOR_INCLUDE_DIRS
    NAMES ais_simulator/api.h
    HINTS $ENV{AIS_SIMULATOR_DIR}/include
        ${PC_AIS_SIMULATOR_INCLUDEDIR}
    PATHS ${CMAKE_INSTALL_PREFIX}/include
          /usr/local/include
          /usr/include
)

FIND_LIBRARY(
    AIS_SIMULATOR_LIBRARIES
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

include("${CMAKE_CURRENT_LIST_DIR}/ais_simulatorTarget.cmake")

INCLUDE(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(AIS_SIMULATOR DEFAULT_MSG AIS_SIMULATOR_LIBRARIES AIS_SIMULATOR_INCLUDE_DIRS)
MARK_AS_ADVANCED(AIS_SIMULATOR_LIBRARIES AIS_SIMULATOR_INCLUDE_DIRS)
