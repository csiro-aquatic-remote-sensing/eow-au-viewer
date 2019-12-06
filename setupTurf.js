// Create minimal turf.js library - http://turfjs.org/getting-started
// Run:
// npm install -g browserify   # Once to install this application
// browserify setupTurf.js -s turf > lib/turfLib.js

module.exports = {
  turfPointsWithinPolygon: require('@turf/points-within-polygon'),
  turfLineToPolygon: require('@turf/line-to-polygon'),
  turfHelpers: require('@turf/helpers'),
};
