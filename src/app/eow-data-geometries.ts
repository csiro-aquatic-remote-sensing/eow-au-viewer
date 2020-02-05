import GeoJSON from 'ol/format/GeoJSON';
import {
  Feature, featureCollection,
  FeatureCollection,
  featureCollection as turfFeatureCollection,
  point as turfPoint,
  Point, Polygon
} from '@turf/helpers';
import {
  Brolog,
} from 'brolog';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import {BehaviorSubject} from 'rxjs';
import {featureEach} from '@turf/meta';
import circle from '@turf/circle';
import {EowDataStruct, PointsMap, SourcePointMarginsType} from './eow-data-struct';

const theClass = 'EowDataGeometries';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the geometries of the EOW Data.  It extracts the point data.
 */

const WFS_URL = 'https://geoservice.maris.nl/wms/project/eyeonwater_australia?service=WFS'
  + '&version=1.0.0&request=GetFeature&typeName=eow_australia&maxFeatures=5000&outputFormat=application%2Fjson';
const EXPANDING_POINTS_RADIUS_METRES = 135; // This value chosen as it selects JMaze's EOW Data points that are on Parke's way near
                                            // Lake Burley Griffin due to some error in GPS or other
const EXPANDING_POINTS_NUMBER = 4;

export default class EowDataGeometries {
  /**
   * EOW Data Points as read from the WFS data
   */
  pointsObs: BehaviorSubject<FeatureCollection<Point>>;
  /**
   * EOW Data Points + margin / circle around that point
   */
  pointsErrorMarginObs: BehaviorSubject<SourcePointMarginsType[]>;
  /**
   * Map from all points in pointsErrorMarginObs back to the EOW Data Point (sourcePoint)
   */
  allPointsMapObs: BehaviorSubject<PointsMap>;
  /**
   * FlatMap of everything in pointsErrorMarginObs.  Can use this for intersections with waterbody polygons and then use allPointsMapObs
   * to map all intersected points back to the EOW Data Point (sourcePoint)
   */
  allPointsObs: BehaviorSubject<FeatureCollection<Point>>;

  constructor(private log: Brolog) {}

  async init() {
    await this.readEowDataPoints();
    await this.calculatePointsErrorMargin();
    await this.generatePointsMap();
    return this; // so can chain the init to the declaration
  }

  /**
   * Read the EOW Data points from the WFS end point.  Saves in the
   *
   * This calculates the data and saves in pointsObs Behaviour Subject (an Observable).
   */
  private async readEowDataPoints() {
      try {
        const response = await fetch(WFS_URL);
        const geoJSONFeatures = new GeoJSON().readFeatures(await response.json(), {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326'});
        const features: Feature<Point>[] = [];
        // Should return a promise here
        for (const feature of geoJSONFeatures) {
          const simpleGeometry = feature.getGeometry() as SimpleGeometry;
          const featurePoint: Feature<Point> = turfPoint(simpleGeometry.getCoordinates(), feature);
          features.push(featurePoint);
        }
        const points = turfFeatureCollection(features);
        this.pointsObs = new BehaviorSubject<FeatureCollection<Point>>(points);

        this.log.silly(theClass, `EOWDataGeometries - ${JSON.stringify(points)}`);
      } catch (error) {
        this.log.error(error);
        // reject(error);
        this.pointsObs = new BehaviorSubject<FeatureCollection<Point>>(null);
      }
  }

  /**
   * We have the option of expanding the data point size since due to some quirks in the system (GPS or the definition of the water bodies),
   * the actual EOWData may lie just outside the water body it is associated with.
   *
   * Each layer can specify if they wish to use this (option.useErrorMargin).
   *
   * This calculates the data and saves in pointsErrorMarginObs Behaviour Subject (an Observable).
   *
   * @returns object - {sourcePoint: <centre point>, margins: FeatureCollection<Point>(<points around centre point>)}
   */
  private async calculatePointsErrorMargin() {
    this.pointsObs.asObservable().subscribe(eowPoints => {
      const errorMarginPoints: SourcePointMarginsType[] = [];
      const allPoints: FeatureCollection<Point> = {
        features: [] ,  // Array<Feature<Point, Properties>>,
        type: 'FeatureCollection'
      };
      featureEach(eowPoints, f => {
        const circleAround: Feature<Polygon> = circle(f, EXPANDING_POINTS_RADIUS_METRES / 1000, {
          steps: EXPANDING_POINTS_NUMBER,
          units: 'kilometers'
        });
        const p = circleAround.geometry.coordinates[0];
        const points = featureCollection(p.map(c => turfPoint(c)));
        const circlePoints =  {sourcePoint: f, margins: points};
        allPoints.features.push(...points.features);

        errorMarginPoints.push(circlePoints);
      });
      this.pointsErrorMarginObs = new BehaviorSubject(errorMarginPoints);
      this.allPointsObs = new BehaviorSubject<FeatureCollection<Point>>(allPoints);
    });
  }

  /**
   * When we calculate the intersections between the errorMarginPoints.sourcePoint and errorMarginPoints.margins we want to treat the
   * margins Points like they are the sourcePoint.  Otherwise we will get weird visual features.  This primarily pertains to when using
   * DEBUG to draw lines between pieCharts and the EOWData Points (but we might treat that as a production feature anyway).
   *
   * Create a map from all points to the corresponding sourcePoint
   *
   * @param errorMarginPoints with the sourcePoint feature and marginPoints FeatureCollection.
   */
  private async generatePointsMap() {
    this.pointsErrorMarginObs.asObservable().subscribe(errorMarginPoints => {
      const pointsMap: PointsMap = {};

      errorMarginPoints.forEach(emp => {
        pointsMap[EowDataStruct.createPointString(emp.sourcePoint)] = emp.sourcePoint;
        emp.margins.features.forEach(margin => {
          pointsMap[EowDataStruct.createPointString(margin)] = emp.sourcePoint;
        });
      });

      this.allPointsMapObs = new BehaviorSubject<PointsMap>(pointsMap);
    });
  }
}
