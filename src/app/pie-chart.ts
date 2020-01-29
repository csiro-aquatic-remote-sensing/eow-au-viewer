import colors from './colors.json';
import {
  Brolog,
} from 'brolog';
import * as d3 from 'd3';

const theClass = 'PieChart';

const widthFactor = 9;
const pieWidth = 1.0;
const opaqueness = 0.7;

const DEBUG_DrawLines = true; // If true then draw line from center of pie chart to the features that the chart is for
export class PieChart {
  constructor(private log: Brolog) {
  }

  /**
   * Draw pie chart of features (FU Values) at elementId
   *
   * @param features to make up the segments of the pie chart
   * @param elementId of div to draw chart in to
   * @param sizeScaleFactor used to create the height and width
   * @param point that the chart will be drawn at.  This doesn't need to know this but use for debug purposes.  For example draw line from
   * this point to the point of each feature that the chart is for.
   */
  drawD3(preparedChartData, elementId, sizeScaleFactor, point: number[]) {
    const width = widthFactor * sizeScaleFactor;
    const fontSize = 1.0 * sizeScaleFactor;
    const theFUColours = this.getFUColours();

    // Delete any existing pie-chart that existed in the elementId
    d3.select('#' + elementId).select('svg').remove();

    // 2. Create chart dimensions

    this.log.verbose(theClass, `${JSON.stringify(preparedChartData, null, 2)}`);
    const dimensions = {
      width,
      height: width,
      boundedWidth: 0,
      boundedHeight: 0,
      margin: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
      },
    };
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // 3. Draw canvas

    const wrapper = d3.select('#' + elementId)
    // .attr('class', 'svg-container')
      .append('svg')
      .attr('width', '' + dimensions.width)
      .attr('height', '' + dimensions.height);

    const bounds = wrapper.append('g')
      .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

    // 4. Create scales

    const arcGenerator = d3.pie()
      .padAngle(0.005)
      .value(d => d.y.count); // .length);

    const arcs = arcGenerator(preparedChartData);

    // const interpolateWithSteps = numberOfSteps => new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));
    // const colorScale = d3.scaleOrdinal()
    //   .domain(arcs.sort((a, b) => a.data.y - b.data.y).map(d => d.index))
    //   .range(interpolateWithSteps(combinedDatasetByIcon.length).map(d3.interpolateLab('#ffffff', '#000000')));  // "#f3a683", "#3dc1d3")))

    const radius = dimensions.boundedWidth / 2;
    const arc = d3.arc()
      .innerRadius(radius * (1 - pieWidth)) // set to 0 for a pie chart
      .outerRadius(radius);

    // 5. Draw data

    const centeredGroup = bounds.append('g')
      .attr('transform', `translate(${dimensions.boundedHeight / 2}, ${dimensions.boundedWidth / 2})`);

    centeredGroup.selectAll('path')
      .data(arcs)
      .enter().append('path')
      .attr('fill', d => '' + theFUColours[d.data.name])  // d.data.key == "other" ? "#dadadd" : colorScale(d.data.key))
      .attr('d', arc)
      .append('title')
      .text(d => `FU: ${d.data.name}`);  // d => d.data.name);

    const iconGroups = centeredGroup.selectAll('g')
      .data(arcs)
      .enter().append('g')
      .attr('transform', d => `translate(${arc.centroid(d)})`);

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
      .attr('style', `fill: #000000; stroke: #000000; font-size: ${fontSize}`);
  }

  setChartSize() {
    // d3.select('.pieChart_svg')
    //   .attr('width', '200')
    //   .attr('height', '200');
  }

  getFUColours() {
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
