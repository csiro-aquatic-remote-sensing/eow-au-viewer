import Brolog from 'brolog';
import {Feature, feature as turfFeature, FeatureCollection, Point, point as turfPoint, Polygon} from '@turf/helpers';
import moment from 'moment';

const theClass = 'EowDataStruct';
const brologLevel = 'verbose';
const log = new Brolog();

export type Coords = [number, number];

/**
 * Data structure for the waterbody - the polygon that defines it and an English name
 */
export interface WaterBody {
  name: string;
  polygon: Feature<Polygon>;
}

/**
 * Data structure for the waterbody and the points from the EOWData that are contained within it
 */
export interface EowWaterBodyIntersection {
  waterBody: WaterBody;
  eowData: FeatureCollection<Point>;
}

/**
 * For every EOWData point, generate a circle of 'error margin' points around it
 */
export interface SourcePointMarginsType {
  sourcePoint: Feature<Point>;
  margins: FeatureCollection<Point>;
}

export type PointsMap = { [pointString: string]: Feature<Point> };  // tslint:disable-line

const STATIC_INIT = Symbol();

export class EowDataStruct {
  /**
   * Static Constructor (called at end of file)
   */
  public static[STATIC_INIT] = () => {
    log.level(brologLevel);
  }

  /**
   * @Return Aggregated FU data as an array of objects:
   * [
   *  {
   *    name: <FU Value>,
   *    y: {
   *       <fu value> : {count: number of that <fu value>, points: the map geo points that have those values>}
   *    }
   *  },
   *  ...
   * ]
   * @param features - the EOWdata that is all located in the same waterbody
   */
  static preparePieChartData(features): any {
    const aggregateFUValues = (fuValuesInFeatures) => {
      const eowDataReducer = (acc, currentValue) => {
        if (currentValue.values_ && currentValue.values_.fu_value) {
          if (acc.hasOwnProperty(currentValue.values_.fu_value)) {
            ++acc[currentValue.values_.fu_value].count;
            acc[currentValue.values_.fu_value].points.push(currentValue.getGeometry().getCoordinates());
          } else {
            acc[currentValue.values_.fu_value] = {
              count: 1,
              points: [currentValue.getGeometry().getCoordinates()]
            };
          }
        }
        return acc;
      };
      return features.reduce(eowDataReducer, {});
    };
    // Add zeros for all the other FUs since the colours in the pie charts are from the ordinal number of the data, NOT the value
    // of it's "name" attribute
    // TODO - i don't believe this is necessary, or it should be renamed 'objectToArray'
    const setMissingFUsToZero = (fUValuesObj) => {
      return Object.keys(fUValuesObj).map(i => {
        return parseInt(i, 10);
      });
    };
    const arrayToObject = (array) =>
      array.reduce((obj, item) => {
        obj[item] = item;
        return obj;
      }, {});

    const eowDataFUValues = aggregateFUValues(features);
    const arrayFUValues = setMissingFUsToZero(eowDataFUValues);
    const arrayFUValuesObj = arrayToObject(arrayFUValues);

    const eowData = Object.keys(arrayFUValuesObj).map(k => {
      return {name: k, y: eowDataFUValues[k]};
    });
    log.silly(theClass, `EOWData: ${JSON.stringify(eowData)}`);
    return eowData;
  }

  /**
   * @Return FU data sorted by date in ascending order as an array of objects.  If there are the same date sort those in FU order:
   * [
   *  {
   *    name: <FU Value>,
   *    date: <date>
   *  },
   *  ...
   * ]
   * @param features - the EOWdata that is all located in the same waterbody
   */
  static prepareTimeSeriesChartData(features): any {
    const aggregateFUValues = (theFeatures) => {
      return theFeatures.map(f => {
        return {fu: f.values_.fu_value, date: f.values_.date_photo};
      });
    };
    const arrayToObject = (array) =>
      array.reduce((obj, item) => {
        obj[item] = item;
        return obj;
      }, {});

    const fuDateComparator = (a, b) => {
      const dA = moment(a.date);
      const dB = moment(b.data);

      if (dA.isSame(dB)) {
        return a.fu - b.fu;
      } else {
        return dA.isBefore(dB);
      }
    };

    const eowDataFUValues = aggregateFUValues(features);
    // const arrayFUValuesObj = arrayToObject(eowDataFUValues);
    const sortedFUDates = eowDataFUValues.sort(fuDateComparator);

    log.silly(theClass, `EOWData: ${JSON.stringify(sortedFUDates)}`);
    return sortedFUDates;
  }

  /**
   * Modify in to format as specified in calculateLayerIntersections().
   *
   * @param intersection - the data from the Turfjs pointsWithinPolygon()
   */
  static createEoWFormat(intersection: FeatureCollection<Point>, waterBody: Feature<Polygon>): EowWaterBodyIntersection {
    if (intersection.features.length === 0) {
      return {
        waterBody: {
          polygon: waterBody,
          name: 'TBD'
        },
        eowData: null
      };
    }
    const eowWaterbodyIntersection: EowWaterBodyIntersection = {
      waterBody: {
        polygon: waterBody,
        name: 'TBD'
      },
      eowData: intersection
    };
    // intersection.features[0].properties = {'now in eowData field': true};
    return eowWaterbodyIntersection;
  }

  /**
   * For use with type PointsMap.
   *
   * @param point to create string version of required when the point used as an Object key
   */
  static createPointString(point: Feature<Point>): string {
    const c = point.geometry.coordinates;
    return '' + c[0] + '+' + c[1];
  }

  static recreatePointFromString(pointString: string): Feature<Point> {
    const parts = pointString.split('+');
    return turfPoint([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
  }
}

// Call the init once
EowDataStruct[STATIC_INIT]();
