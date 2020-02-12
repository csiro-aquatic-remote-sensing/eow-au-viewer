import {
  Brolog,
} from 'brolog';
// import d3 from 'd3';
import { select } from 'd3-selection';
import { scaleTime } from 'd3-scale';
import { extent } from 'd3-array';
import colors from '../colors.json';
import {PieChart} from './pie-chart';
import {TimeSeriesItem, TimeSeriesItems} from '../eow-data-struct';

const theClass = 'TimeSeriesChart';

const widthFactor = 50;
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
  public static [STATIC_INIT] = () => {
    log.level(brologLevel);
  }

  /**
   * Draw pie chart of features (FU Values) at elementId
   *
   * @param preparedChartData to make up the segments of the pie chart
   * @param elementId of div to draw chart in to
   * @param sizeScaleFactor used to create the height and width
   */
  static draw(preparedChartData: TimeSeriesItems, elementId: string, sizeScaleFactor: number) {
    const width = widthFactor * sizeScaleFactor;
    const fontSize = 0.8 * sizeScaleFactor;
    const fontWeight = 20;
    const theFUColours = TimeSeriesChart.getFUColours();

    const metricAccessor = d => d.date;

    // Delete any existing pie-chart that existed in the elementId
    select('#' + elementId).select('svg').remove();

    const dimensions = {
      width,
      height: width * 0.6,
      margin: {
        top: 30,
        right: 10,
        bottom: 50,
        left: 50
      },
      boundedWidth: 0,
      boundedHeight: 0
    };

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const wrapper = select('#' + elementId)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const bounds = wrapper.append('g')
      .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px`);

    const xScale = scaleTime()
      .domain(extent<TimeSeriesItem, Date>(preparedChartData, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const group = bounds.append('g');

    const groups = group.selectAll('g')
      .data(preparedChartData)
      .enter()
      .append('g');

    const barPadding = 0;
    const stripeWidth = 2;

    const barRects = groups.append('rect')
      .attr('x', d => d.index * (stripeWidth + barPadding / 2))
      .attr('y', 1)
      .attr('width', stripeWidth)
      .attr('height', 50)
      .attr('fill', d => '' + theFUColours[d.fu]);

    TimeSeriesChart.debugBarRects(barRects);
  }

  static debugBarRects(barRects) {
    console.log(`BarRects:`);
    barRects._groups[0].forEach((rect, index) => {
      const attr = rect.attributes;
      console.log(`  x: ${attr.x.value}, y: ${attr.y.value}, width: ${attr.width.value}, `
        + `height: ${attr.height.value}, colour: ${attr.fill.value}`);
    });
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
