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
  Feature as TurfFeature, lineString as turfLineString
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
import {fillStyle, Layers, redLines} from './layers';
import GeoJSON from 'ol/format/GeoJSON';
import {Style} from 'ol/style';
import Stroke from 'ol/style/Stroke';
import bboxPolygon from '@turf/bbox-polygon';
import clustersKmeans from '@turf/clusters-kmeans';
import {clusterEach} from '@turf/clusters';
import {Md5} from 'ts-md5/dist/md5';

const theClass = 'GisOps';
const log = Brolog.instance(brologLevel);

export class GisOps {
  public static createFeatureCollection(features: Feature[]): FeatureCollection<Polygon> {
    const theTurfFeatures: GeoJsonFeature<Polygon>[] = GisOps.createTurfFeatures(features);
    const featureCollection: FeatureCollection<Polygon> = turfFeatureCollection<Polygon>(theTurfFeatures);
    return featureCollection;
  }

  public static turfFeaturesToOlFeatures(features: TurfFeature<Polygon>[]): Feature[] {
    const format = new GeoJSON();
    return features.map(f => {
      const p = polygon(f.geometry.coordinates);
      const lsFeature = format.readFeature(p, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:4326'
      });
      return lsFeature;
    });
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
   * Return the source points for all points in the given allPointsIntersection (it includes source points + error margin points).  When a
   * line is drawn from a pie chart to its EOW data point, the lines should go to the source point, not the error margin points around it.
   *
   * @param allPointsIntersection are the EOWData points found within one waterlayer polygon (the one being searched outside this method)
   * @param allPointsMap is the source EOWData points + their error margin points (ie. A point with a concentric circle of points around)
   * @return the source points in allPointsMap (essentially map used source points + error margin points to their source point)
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
  static filterFromEOWDataBbox(waterBodyFeatureCollection: FeatureCollection<Polygon>, points: FeatureCollection<Point>,
                               layers: Layers, layerName: string): FeatureCollection<Polygon> {
    const pointsBbox: BBox = bbox(points);
    GisOps.drawBox(bboxPolygon(pointsBbox), layers, layerName);
    const features: TurfFeature<Polygon>[] = [];
    featureEach<Polygon>(waterBodyFeatureCollection, async f => {
      const bboxClipped = bboxClip<Polygon>(f, pointsBbox) as TurfFeature<Polygon>;
      // filter out zero-sized polygons
      if (bboxClipped.geometry.coordinates.length > 0) {
        features.push(bboxClipped);
      }
    });
    return turfFeatureCollection<Polygon>(features);
  }

  /**
   * Limit the number of waterbody polygons that need to be searched by filtering those given to be in a bounding box around the given EOWData points.
   * Cluster the EOData points.
   *
   * @param waterBodyFeatureCollection waterbody polygons that for are most likely those in the map view extent
   * @param points are the EOWData points that are most likely those in the map view extent
   * @return waterBodyFeatureCollection filtered to be those in the bbox created around the given points
   */
  static filterFromClusteredEOWDataBbox(waterBodyFeatures: Feature[], points: FeatureCollection<Point>,
                                        layers: Layers, layerName: string): FeatureCollection<Polygon> {
    // Get clusters of EOWPoints, bbox each one and filter on these
    const waterBodyFeatureCollection: FeatureCollection<Polygon> = GisOps.createFeatureCollection(waterBodyFeatures);
    const clusteredPoints: FeatureCollection<Point> = clustersKmeans(points);
    const features: TurfFeature<Polygon>[] = [];
    const seenPolygons: { [name: string]: boolean } = {};

    layers.clearLayerOfWFSFeatures(layerName);
    clusterEach(clusteredPoints, 'cluster', (cluster, clusterValue, index) => {
      const pointsBbox: BBox = bbox(cluster);
      GisOps.drawBox(bboxPolygon(pointsBbox), layers, layerName);
      featureEach<Polygon>(waterBodyFeatureCollection, async f => {
        const bboxClipped = bboxClip<Polygon>(f, pointsBbox) as TurfFeature<Polygon>;
        // filter out zero-sized polygons
        if (bboxClipped.geometry.coordinates.length > 0) {
          // Only add a water body once despite possible multiple clusters covering any water body
          const geomSha3 = GisOps.buildGeometryChecksum(f.geometry.coordinates);
          if (!seenPolygons.hasOwnProperty(geomSha3)) {
            log.silly(theClass, `cluster filter - polygon not seen: ${geomSha3}`);
            features.push(f);
            seenPolygons[geomSha3] = true;
          } else {
            log.silly(theClass, `cluster filter - seen polygon: ${geomSha3}`);
          }
        } else {
          console.log(`cluster filter - coords <=0`);
        }
      });
    });
    return turfFeatureCollection<Polygon>(features);
  }

  private static async drawBox(bboxClipped: TurfFeature<Polygon>, layers: Layers, layerName: string) {
    const olFeatures = GisOps.turfFeaturesToOlFeatures([bboxClipped]);
    await layers.createLayerFromWFSFeatures(olFeatures, {
      clear: false,
      style: new Style({
        stroke: new Stroke({color: 'rgba(255, 25, 125, 1)', width: 1.5, lineCap: 'butt'})
      }),
      visible: true,
      layerDisplayName: layerName
    }, null);
  }

  /**
   * Create a unique identifier for a polygon.
   *
   * @param coordinates as input into checksum algorithm
   */
  private static buildGeometryChecksum(coordinates: number[][][]): string {
    const value = coordinates.reduce((a, b) => [...a, ...b], []);

    return Md5.hashStr(value.join('_')) as string;
  }
}
