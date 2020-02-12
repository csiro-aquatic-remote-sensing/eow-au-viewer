import {
  Brolog,
} from 'brolog';
import * as d3 from 'd3';
import colors from '../colors.json';
import {PieChart} from './pie-chart';

const theClass = 'TimeSeriesChart';

const widthFactor = 9;
const pieWidth = 1.0;
const opaqueness = 0.7;

// TODO - need to use common application level
const brologLevel = 'verbose';
const log = new Brolog();

const STATIC_INIT = Symbol();

export class TimeSeriesChart {
  /**
   * Static Constructor (called at end of file)
   */
  public static[STATIC_INIT] = () => {
    log.level(brologLevel);
  }

  /**
   * Draw pie chart of features (FU Values) at elementId
   *
   * @param preparedChartData to make up the segments of the pie chart
   * @param elementId of div to draw chart in to
   * @param sizeScaleFactor used to create the height and width
   */
  static draw(preparedChartData, elementId, sizeScaleFactor) {
    const width = widthFactor * sizeScaleFactor;
    const fontSize = 0.8 * sizeScaleFactor;
    const fontWeight = 20;
    const theFUColours = TimeSeriesChart.getFUColours();

    // Delete any existing pie-chart that existed in the elementId
    d3.select('#' + elementId).select('svg').remove();
  }

  // TODO this is dupe with PieChart
  static getFUColours() {
    const cArray = Object.keys(colors);
    return cArray.map(c => {
      const index = (parseInt(c, 10)) % cArray.length;
      // console.log(`colors length: ${cArray.length}, c: ${c}, color index: ${index}`);
      return colors[index].replace(')', ` , ${opaqueness})`);
    });
  }

}

// Call the init once
TimeSeriesChart[STATIC_INIT]();
