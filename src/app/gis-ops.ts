import Feature from 'ol/Feature';
import {
  BBox,
  featureCollection as turfFeatureCollection,
  FeatureCollection,
  lineString,
  multiLineString,
  multiPolygon, point as turfPoint, Point,
  polygon,
  Polygon,
  Feature as TurfFeature
} from '@turf/helpers';
import {Feature as GeoJsonFeature, Polygon as GeoJSONPolygon} from '@turf/helpers/lib/geojson';
import bbox from '@turf/bbox';
import {featureEach} from '@turf/meta';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import lineToPolygon from '@turf/line-to-polygon';
import {brologLevel} from './globals';
import Brolog from 'brolog';
import bboxClip from '@turf/bbox-clip';
import {EowDataStruct, PointsMap} from './eow-data-struct';

const theClass = 'GisOps';
const log = Brolog.instance(brologLevel);

export class GisOps {
  public static createFeatureCollection(features: Feature[]): FeatureCollection<Polygon> {
    const theTurfFeatures: GeoJsonFeature<Polygon>[] = GisOps.createTurfFeatures(features);
    const featureCollection: FeatureCollection<Polygon> = turfFeatureCollection<Polygon>(theTurfFeatures);
    return featureCollection;
  }

  public static createTurfFeatures(features: Feature[]): GeoJsonFeature<Polygon>[] {
    const theTurfFeatures: GeoJsonFeature<Polygon>[] = [];

    features.forEach(feature => {
      const simpleGeometry = feature.getGeometry() as SimpleGeometry;
      switch (feature.getGeometry().getType().toLowerCase()) {
        case  'linestring':
          this.convertLineString(theTurfFeatures, simpleGeometry);
          break;
        case 'multilinestring':
          this.convertMultiLineString(theTurfFeatures, simpleGeometry);
          break;
        case 'polygon':
          this.convertPolygon(theTurfFeatures, simpleGeometry);
          break;
        case 'multipolygon':
          this.convertMultiPolygon(theTurfFeatures, simpleGeometry);
          break;
        case 'point':
          // ignore points
          break;
        default:
          throw new Error(`Unhandled type: ${feature.getGeometry().getType()}`);
      }
    });
    return theTurfFeatures;
  }

  private static convertLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    // The difference between lineString and Polygon is that a Polygon is explicitly closed (ie. the first and last coords are same) ???
    const turfLine = lineString(coordinates);
    if (turfLine.geometry.coordinates.length >= 3) {
      const polygonObj = lineToPolygon(turfLine);
      dataDestination.push(polygonObj);
    } else {
      log.verbose(theClass, `Turfline has < 3 coords: ${turfLine.geometry.coordinates.length} - `
        + `${JSON.stringify(turfLine.geometry.coordinates)}`);
    }
  }

  private static convertMultiLineString(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const turfLine = multiLineString(coordinates.filter(c => c.length > 2));
    turfLine.geometry.coordinates.forEach(c => {
      log.silly(theClass, `convertMultilineString - size of arrays: ${c.length} -> ${JSON.stringify(c)}`);
    });
    const polygonObj = lineToPolygon(turfLine);
    dataDestination.push(polygonObj);
  }

  private static convertPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const polygonObj = polygon(coordinates);
    dataDestination.push(polygonObj);
  }

  private static convertMultiPolygon(dataDestination, simpleGeometry: SimpleGeometry) {
    const coordinates = simpleGeometry.getCoordinates();
    const multiPolygon1 = multiPolygon(coordinates);
    dataDestination.push(multiPolygon1);
  }


  /**
   * Return all points related to the given allPointsIntersection - that point plus its error margin points.
   *
   * @param allPointsIntersection are the EOWData points within waterlayer polygons
   * @param allPointsMap is the source EOWData points and their respective error margin points (ie. A point with a concentric circle of points around - only 4)
   * @return the error margin points in allPointsMap that have a source point in allPointsIntersection
   */
  static filterSourcePoints(allPointsIntersection: FeatureCollection<Point>, allPointsMap: PointsMap): FeatureCollection<Point> {
    const filteredPoints: FeatureCollection<Point> = {
      features: [],  // Array<Feature<Point, Properties>>,
      type: 'FeatureCollection'
    };
    const pointsAlreadyFiltered: PointsMap = {};
    allPointsIntersection.features.forEach(api => {
      const coords = api.geometry.coordinates;
      const pointString = EowDataStruct.createPointMapString(turfPoint(coords));
      if (allPointsMap.hasOwnProperty(pointString) && !pointsAlreadyFiltered.hasOwnProperty(pointString)) {
        pointsAlreadyFiltered[pointString] = null;
        filteredPoints.features.push(allPointsMap[pointString]);
      }
    });
    return filteredPoints;
  }

  /**
   * Limit the number of waterbody polygons that need to be searched by filtering those given to be in a bounding box around the given EOWData points.
   * @param waterBodyFeatureCollection waterbody polygons that for are most likely those in the map view extent
   * @param points are the EOWData points that are most likely those in the map view extent
   * @return waterBodyFeatureCollection filtered to be those in the bbox created around the given points
   */
  static filterFromEOWDataBbox(waterBodyFeatureCollection: FeatureCollection<Polygon>, points: FeatureCollection<Point>): FeatureCollection<Polygon> {
    const pointsBbox: BBox = bbox(points);
    const features: TurfFeature<Polygon>[] = [];
    featureEach<Polygon>(waterBodyFeatureCollection, f => {
      const bboxClipped = bboxClip<Polygon>(f, pointsBbox) as TurfFeature<Polygon>;
      // filter out zero-sized polygons
      if (bboxClipped.geometry.coordinates.length > 0) {
        features.push(bboxClipped);
      }
    });
    return turfFeatureCollection<Polygon>(features);
  }
}
