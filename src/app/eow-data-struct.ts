import Brolog from 'brolog';
import {Feature as TurfFeature, FeatureCollection, Point, point as turfPoint, Polygon} from '@turf/helpers';
import {Position} from 'geojson';
import moment from 'moment-timezone';
import {brologLevel} from './globals';
import DurationConstructor = moment.unitOfTime.DurationConstructor;

const theClass = 'EowDataStruct';
const log = Brolog.instance(brologLevel);

export type Coords = [number, number];

export interface TimeSeriesItem {
  fu: string;
  date: string;
  index: number;
  comment?: string;
}

export type TimeSeriesItems = TimeSeriesItem[];

export interface PieItemObject {
  count: number;
  points: Coords[];
}

export interface PieItem {
  name: string;
  y: PieItemObject;
}

export type PieItems = PieItem[];

/**
 * Data structure for the waterbody - the polygon that defines it and an English name
 */
export interface WaterBody {
  name: string;
  polygon: TurfFeature<Polygon>;
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
  sourcePoint: TurfFeature<Point>;
  margins: FeatureCollection<Point>;
}

export type PointsMap = { [pointString: string]: TurfFeature<Point> };  // tslint:disable-line

moment.tz.add('Etc/UTC|UTC|0|0||');

export class EowDataStruct {
  /**
   * @Return Aggregated FU data as an array of objects:
   * [
   *  {
   *    name: <FU Value>,
   *    y: {
   *        count: number of that <fu value>,
   *        points: the map geo points that have those values>
   *    }
   *  },
   *  ...
   * ]
   * @param features - the EOWdata that is all located in the same waterbody
   */
  static preparePieChartData(features): PieItems {
    const aggregateFUValues = () => {
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

    const eowDataFUValues = aggregateFUValues();
    const arrayFUValues = setMissingFUsToZero(eowDataFUValues);
    const arrayFUValuesObj = arrayToObject(arrayFUValues);

    const eowData = Object.keys(arrayFUValuesObj).map(k => {
      return {name: k, y: eowDataFUValues[k]};
    });
    log.silly(theClass, `EOWData: ${JSON.stringify(eowData)}`);
    return eowData;
  }

  /**
   * @Return FU data sorted by date in ascending order as an array of objects.  If there are the same date, then also sort by FU value:
   * [
   *  {
   *    name: <FU Value>,
   *    date: <date>,
   *    ordinal: index of this item in array
   *  },
   *  ...
   * ]
   * @param features - the EOWdata that is all located in the same waterbody
   */
  static prepareTimeSeriesChartData(features): TimeSeriesItems {
    const aggregateFUValues = (theFeatures: any[]) => {
      return theFeatures.map(f => {
        return {fu: f.values_.fu_value, date: f.values_.date_photo};
      });
    };
    const uniqArray = (a) => {
      const seen = {};
      return a.filter(item => {
        return seen.hasOwnProperty(item.date) ? false : (seen[item.date] = true);
      });
    };
    const fuDateComparator = (a, b) => {
      const dA = moment(a.date);
      const dB = moment(b.date);

      let result;
      if (dA.isSame(dB)) {
        result = a.fu - b.fu;
      } else {
        result = dA.isBefore(dB) ? -1 : 1;
      }
      return result;
    };

    /**
     * Add the 'index' field.  I don't know if necessary but using to help to graph.
     *
     * @param items - add index field to all of the items
     */
    const addOrdinal = (items: TimeSeriesItems) => {
      let index = 0;
      return items.map(i => {
        return {...i, index: index++};
      });
    };

    /**
     * If there is only one entry then the graph can't be drawn (since it is a line graph).  In which case double up that single point and
     * thus make the line a point.  Doesn't quite work so I will add a slight offset.
     * It adds a 'comment' field to indicate it is artificial.
     * @param items to check
     */
    const doubleUpSingleEntryFn = (items: any) => {
      if (items.length === 1) {
        // Alter data of 2nd data point to 'create a line'
        const m = moment(items[0].date).add(1, 'h' as DurationConstructor);
        const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ssZZ';

        const newItem = {fu: items[0].fu, date: m.tz('Etc/UTC').format(dateTimeFormat).replace(/\+0+/, 'Z'), comment: 'artificial'};
        items.push(newItem);
        items[0].comment = 'artificial';
      }
      return items;
    };

    const eowDataFUValues = aggregateFUValues(features);
    // const arrayFUValuesObj = arrayToObject(eowDataFUValues);
    const sortedFUDates = eowDataFUValues.sort(fuDateComparator);
    const deDupe = uniqArray(sortedFUDates);
    const doubleUpSingleEntry = doubleUpSingleEntryFn(deDupe);
    const withOrdinal = addOrdinal(doubleUpSingleEntry);

    log.verbose(theClass, `EOWData: ${JSON.stringify(withOrdinal)}`);
    return withOrdinal;
  }

  /**
   * Modify to be in the format as specified in calculateLayerIntersections().
   *
   * @param intersection - the data from the Turfjs pointsWithinPolygon()
   * @param waterBody - polygons data
   */
  static createEoWFormat(intersection: FeatureCollection<Point>, waterBody: TurfFeature<Polygon>): EowWaterBodyIntersection {
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
  static createPointMapString(point: TurfFeature<Point>): string {
    const c = point.geometry.coordinates;
    return EowDataStruct.createPointSting(c);
  }

  static createPointSting(c: Position) {
    return '' + c[0] + '+' + c[1];
  }

  static recreatePointFromString(pointString: string): TurfFeature<Point> {
    const parts = pointString.split('+');
    return turfPoint([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
  }

  /**
   * Given a point, return the same but to precision of 6 decimal places.
   */
  static pointToPrecision(p: Position): Position {
    const precise = (x) => {
      return Number.parseFloat(x.toPrecision(6));
    };

    return [precise(p[0]), precise(p[1])];
  }
}
