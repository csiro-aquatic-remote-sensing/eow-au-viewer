import colors from '../colors.json';
import {
  Brolog,
} from 'brolog';
// import * as d3 from 'd3';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { pie, arc } from 'd3-shape';
import {PieItem, PieItemObject, PieItems} from '../eow-data-struct';

const theClass = 'PieChart';

const widthFactor = 9;
const pieWidth = 1.0;
const opaqueness = 0.7;

const brologLevel = 'verbose';
const log = new Brolog();

const STATIC_INIT = Symbol();

export class PieChart {
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
  static drawD3(preparedChartData: PieItems, elementId: string, sizeScaleFactor: number) {
    const width = widthFactor * sizeScaleFactor;
    const fontSize = 0.8 * sizeScaleFactor;
    const fontWeight = 20;
    const theFUColours = PieChart.getFUColours();

    // Delete any existing pie-chart that existed in the elementId
    select('#' + elementId).select('svg').remove();

    // 2. Create chart dimensions

    log.silly(theClass, `${JSON.stringify(preparedChartData, null, 2)}`);
    const dimensions = {
      width,
      height: width,
      boundedWidth: 0,
      boundedHeight: 0,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // 3. Draw canvas

    const wrapper = select('#' + elementId)
    // .attr('class', 'svg-container')
      .append('svg')
      .attr('width', '' + dimensions.width)
      .attr('height', '' + dimensions.height);

    const bounds = wrapper.append('g');
      // .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

    // 4. Create scales

    const arcGenerator = pie<PieItem>()
      .padAngle(0.005)
      .value(d => d.y.count); // .length);

    const arcs = arcGenerator(preparedChartData);

    // const interpolateWithSteps = numberOfSteps => new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));
    // const colorScale = d3.scaleOrdinal()
    //   .domain(arcs.sort((a, b) => a.data.y - b.data.y).map(d => d.index))
    //   .range(interpolateWithSteps(combinedDatasetByIcon.length).map(d3.interpolateLab('#ffffff', '#000000')));  // "#f3a683", "#3dc1d3")))

    const radius = dimensions.boundedWidth / 2;
    const arcInPie = arc<any>()
      .innerRadius(radius * (1 - pieWidth)) // set to 0 for a pie chart
      .outerRadius(radius);

    // 5. Draw data

    const centeredGroup = bounds.append('g')
      .attr('transform', `translate(${dimensions.boundedHeight / 2}, ${dimensions.boundedWidth / 2})`);

    centeredGroup.selectAll('path')
      .data(arcs)
      .enter().append('path')
      .attr('fill', d => '' + theFUColours[d.data.name])  // d.data.key == "other" ? "#dadadd" : colorScale(d.data.key))
      .attr('d', arcInPie)
      .append('title')
      .text(d => `FU: ${d.data.name} #: ${d.data.y.count}`);  // d => d.data.name);

    const iconGroups = centeredGroup.selectAll('g')
      .data(arcs)
      .enter().append('g')
      .attr('transform', d => `translate(${arcInPie.centroid(d)})`);

    // iconGroups.append('path')
    //   .attr('class', 'icon')
    //   .attr('d', d => iconPaths[d.data.key])
    //   .attr('transform', d => `translate(-25, -32) scale(0.5)`);

    // 6. Draw peripherals

    // bounds.append('text')
    //   .attr('class', 'title')
    //   .text('2018 Weather')
    //   .attr('transform', `translate(${dimensions.boundedWidth / 2}, ${dimensions.boundedHeight / 2})`);
    //
    // bounds.append('text')
    //   .attr('class', 'title-small')
    //   .text('New York City, CA')
    //   .attr('transform', `translate(${dimensions.boundedWidth / 2}, ${dimensions.boundedHeight / 2 + 30})`);

    iconGroups.append('text')
      .text(d => d.data.name)
      .attr('class', 'label')
      .attr('transform', `translate(0, 0)`)
      .attr('style', `fill: #000000; stroke: #000000; font-size: ${fontSize}; font-weight: ${fontWeight};`);
  }

  static setChartSize() {
    // d3.select('.pieChart_svg')
    //   .attr('width', '200')
    //   .attr('height', '200');
  }

  static getFUColours() {
    const cArray = Object.keys(colors);
    return cArray.map(c => {
      const index = (parseInt(c, 10)) % cArray.length;
      // console.log(`colors length: ${cArray.length}, c: ${c}, color index: ${index}`);
      return colors[index].replace(')', ` , ${opaqueness})`);
    });
  }

  /**
   *  Draw the pie chart of FU values selected, but the printStats() where the Pie Chart exists is used in other places
   *  The chart is placed into an element with an id.  And as we know you can only have one id (since we only want one graph).
   *  Change the class to id in this one place.
   * @param html that contains 'class="pieChart"'
   */
  fixForThisPieChart(html: string) {
    return html.replace('class="pieChart"', 'id="pieChart"');
  }
}

// Call the init once
PieChart[STATIC_INIT]();
