import Brolog from 'brolog';

const theClass = 'EowDataStruct';
const brologLevel = 'verbose';
const log = new Brolog();

export class EowDataStruct {

  /**
   * Return Aggregated FU data as an array of objects:
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
  static prepareChartData(features): any {
    log.level(brologLevel);
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
    log.verbose(theClass, `EOWData: ${JSON.stringify(eowData)}`);
    return eowData;
  }
}
