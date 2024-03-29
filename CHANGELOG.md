# @koopjs/geoservice-utils

### Unreleased
### Changed
- constrains any WGS84 out-of-bounds coordinates to their known limits (e.g., -95 latitude -> -90 latitude).
- WGS84 latitudes of -90 or 90 are modified to -89.99999 and -89.99999, respectively, allow reprojection to proceed as expected.

## 2.2.3
### Fixed
- add missing WKT-parser dependency to package.json

## 2.2.2
### Fixed
- include type declarations in build

## 2.2.1
### Fixed
- handle single number of string values for object ids

## 2.2.0
### Added
- parse incoming geometry strings as JSON if possible in order to support GET requests

## 2.1.3
### Fixed
- point, line, polygon geometries can have their own spatial reference 

## 2.1.2
### Fixed
- envelope geometries can have their own spatial reference 

## 2.1.1
### Fixed
- function needed export

## 2.1.0
### Adds
- combineObjectIdsAndWhere utility

## 2.0.0
### Major Changes
- breaking change, rename "normalize" to "standardize"

## 1.0.0
### Major Changes
- initial commit