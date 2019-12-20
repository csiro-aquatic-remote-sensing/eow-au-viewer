import {
  point as turfPoint,
  Point,
  feature as turfFeature,
  featureCollection as turfFeatureCollection,
  polygon as turfPolygon, FeatureCollection
} from '@turf/helpers';
import {Feature, lineString, LineString, multiLineString, Polygon, polygon} from '@turf/helpers';
import EOWDataPieChart from './eow-data-piechart';
import * as chai from 'chai';
import GeometryOps, {EowWaterbodyIntersection} from './geometry-ops';
import Brolog from 'brolog';
import LayerGeometries from './layers-geometries';

const expect = chai.expect;

let log: Brolog;
let geometryOps;
let layerData;
let layerName;

const where = 'geometry-ops.spec';

function instanceOfEowWaterbodyIntersection(object: any): object is EowWaterbodyIntersection {
  return 'waterBody' in object &&
    object.waterBody !== null &&
    'polygon' in object.waterBody &&
    'name' in object.waterBody &&
    'eowData' in object;
}

describe('geometry-ops', () => {
  beforeEach(() => {
    log = new Brolog();
    log.level('silly');
    geometryOps = new GeometryOps(log);
  });

  /**
   * Used http://eguruchela.com/math/Calculator/polygon-centroid-point to calculate centroid
   * to determine the values for more complex polygons (hand verified also)
   */
  describe('centroid', () => {
    describe('using calculateCentroidFromFeatureCollection()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const points = turfFeatureCollection(coordinates.map(c => turfPoint(c)));
        const value = geometryOps.calculateCentroidFromFeatureCollection(points);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });

    describe('using calculateCentroidFromPoints()', () => {
      it('centroid of only 1 point is the point itself', () => {
        const coordinates = [[-1000, 1000]];
        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(coordinates[0][0]);
        expect(centroid[1]).to.equal(coordinates[0][1]);
      });

      it('centroid of only 2 points is the middle of the line', () => {
        const coordinates = [[-1000, 1000], [-1000, 2000]];
        const expectedCentroid = [-1000, 1500];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      // Used https://brilliant.org/wiki/triangles-centroid/
      it('centroid of 3 points is the middle of the triangle', () => {
        const coordinates = [[0, 0], [2000, 0], [1000, 1732]];

        const expectedCentroid = [Math.round((0 + 2000 + 1000) / 3), Math.round((0 + 0 + 1732) / 3)]; // 1000, 1732

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 4 points is the middle of the square', () => {
        const coordinates = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]];

        const expectedCentroid = [1000, 1000];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 8 points is the middle of the octogon', () => {
        const coordinates = [[4000, 3200], [3200, 4000], [800, 4000], [0, 3200], [0, 800], [800, 0], [3200, 0], [4000, 800]];

        const expectedCentroid = [2000, 2000];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });

      it('centroid of 5 points is the middle of the pentagram', () => {
        const coordinates = [[2000, 0], [4000, 2000], [2200, 4000], [1800, 4000], [0, 2000]];

        const expectedCentroid = [2000, 2063];

        const value = geometryOps.calculateCentroidFromPoints(coordinates);
        const centroid = value.geometry.coordinates;

        Brolog.silly(`Centroid of polygon: ${JSON.stringify(centroid)}`);
        Brolog.silly(`Expected Centroid: ${JSON.stringify(expectedCentroid)}`);

        expect(centroid[0]).to.equal(expectedCentroid[0]);
        expect(centroid[1]).to.equal(expectedCentroid[1]);
      });
    });
  });

  describe('calculateLayerIntersections', () => {
    const testFeatureCollection = (featureCollection: FeatureCollection<Point>, coordinates: number[][], layerGeometries: LayerGeometries) => {
      expect(featureCollection).to.be.an('object');
      expect(featureCollection).to.have.property('type');
      expect(featureCollection.type).to.equal('FeatureCollection');
      expect(featureCollection).to.have.property('features');
      expect(featureCollection.features).to.be.an('array');
      expect(featureCollection.features).lengthOf(1);
      expect(featureCollection.features[0]).to.be.an('object');
      expect(featureCollection.features[0]).to.have.property('type');
      expect(featureCollection.features[0]).to.have.property('geometry');
      expect(featureCollection.features[0]).to.have.property('properties'); //
      expect(featureCollection.features[0].type).to.equal('Feature');
      expect(featureCollection.features[0].geometry).to.be.an('object');
      expect(featureCollection.features[0].geometry).to.have.property('type');
      expect(featureCollection.features[0].geometry).to.have.property('coordinates');
      expect(featureCollection.features[0].geometry.type).to.equal('Point');
      expect(featureCollection.features[0].geometry.coordinates).to.be.an('array');
      expect(featureCollection.features[0].geometry.coordinates[0]).to.equal(coordinates[0][0]);
      expect(featureCollection.features[0].geometry.coordinates[1]).to.equal(coordinates[0][1]);
      expect(featureCollection.features[0].properties).to.be.an('object');
      const possibleValues = ['testEowData', 'now in eowData field']; // Starts as the first and the code may change to second
      expect(possibleValues).to.include(Object.keys(featureCollection.features[0].properties)[0]);
    };

    const buildEOWDataFeatures = (coordinates) => {
      const polygons = [];
      coordinates.forEach(coordinate => {
        polygons.push(turfPolygon([coordinate]));
      });
      return polygons;
    };

    beforeEach(() => {
      layerData = new LayerGeometries(log);
    });

    describe('one layer, single polygon (square)', () => {
      beforeEach(() => {
        const coordinatesSquare = [[0, 0], [2000, 0], [2000, 2000], [0, 2000], [0, 0]];
        const pointsSquare = turfPolygon([coordinatesSquare]);

        layerData.layerFeatures.square = [pointsSquare];
      });

      it('single square - test point inside', () => {
        const eowPoints = [[100, 100]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, 'square');
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(Object.keys(layerData.layerFeatures).length);
        expect(instanceOfEowWaterbodyIntersection(value[0])).to.be.true;  // tslint:disable-line

        testFeatureCollection(value[0].waterBody.polygon, eowPoints, layerData);
      });

      it('single square - test point on vertice (in)', () => {
        const eowPoints = [[1000, 0]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, 'square');
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(Object.keys(layerData.layerFeatures).length);
        expect(instanceOfEowWaterbodyIntersection(value[0])).to.be.true;  // tslint:disable-line

        testFeatureCollection(value[0].waterBody.polygon, eowPoints, layerData);
      });

      it('single square - test point outside', () => {
        const eowPoints = [[10000, 10000]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, 'square');
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(Object.keys(layerData.layerFeatures).length);
        expect(value[0].waterBody).to.be.null; // tslint:disable-line
        expect(value[0].eowData).to.be.null; // tslint:disable-line
      });
    });

    describe('one layer, multiple polygons (squares), disjoint', () => {
      beforeEach(() => {
        // Disjoint squares (no overlap)
        const coords = [];
        coords.push([[0, 0], [2000, 0], [2000, 2000], [0, 2000], [0, 0]]);
        coords.push([[3000, 0], [5000, 0], [5000, 2000], [3000, 2000], [3000, 0]]);
        coords.push([[6000, 0], [8000, 0], [8000, 2000], [6000, 2000], [6000, 0]]);
        const pointsPolygons = buildEOWDataFeatures(coords);
        layerName = 'multiPolygonSquare';
        layerData.layerFeatures[layerName] = [...pointsPolygons];
      });

      it('test point inside', () => {
        const eowPoints = [[100, 100]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, layerName);
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(layerData.layerFeatures[layerName].length);
        expect(instanceOfEowWaterbodyIntersection(value[0])).to.be.true;  // tslint:disable-line

        testFeatureCollection(value[0].waterBody.polygon, eowPoints, layerData);
      });

      it('test point on vertice (in)', () => {
        const eowPoints = [[1000, 0]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, layerName);
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(layerData.layerFeatures[layerName].length);
        expect(instanceOfEowWaterbodyIntersection(value[0])).to.be.true;  // tslint:disable-line

        testFeatureCollection(value[0].waterBody.polygon, eowPoints, layerData);
      });

      it('test point outside', () => {
        const eowPoints = [[10000, 10000]];
        const eowDataPoints = turfFeatureCollection(eowPoints.map(c => turfPoint(c, {testEowData: true})));
        // const pointsToTest = turfPoint(eowPoints[0]);

        log.verbose(where, `layerData: ${JSON.stringify(layerData)}`);
        log.verbose(where, `eowDataPoints: ${JSON.stringify(eowDataPoints)}`);

        // Test inputs are as expected
        testFeatureCollection(eowDataPoints, eowPoints, layerData);

        // Run function under test
        const value = geometryOps.calculateLayerIntersections(eowDataPoints, layerData, layerName);
        log.verbose(where, `value: ${JSON.stringify(value, null, 2)}`);

        // Test outputs
        expect(value).to.be.an('array');
        expect(value).lengthOf(layerData.layerFeatures[layerName].length);
        expect(value[0].waterBody).to.be.null; // tslint:disable-line
        expect(value[0].eowData).to.be.null; // tslint:disable-line
      });
    });
    // one layer, multiple polygons (squares), overlapping
    // repeat for multiple point tests
    // repeat for multiple layers
  });
});
