import {EowDataStruct, TimeSeriesItem, TimeSeriesItems} from '../eow-data-struct';
import {select} from 'd3-selection';
import {scaleTime, scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {timeParse} from 'd3-time-format';
import {line} from 'd3-shape';
import {axisLeft, axisBottom} from 'd3-axis';
import colors from '../colors.json';

const widthFactor = 80;
const pieWidth = 1.0;
const opaqueness = 0.7;

export class TimeSeriesChartHTML {
  /**
   * Draw time series chart with FU values on vertical axis and date on horizontal in to elementId
   *
   * @param data to massage and draw chart from
   * @param elementId to draw in to
   */
  private timeSeriesData: TimeSeriesItems;

  constructor(private data: any) {
    this.timeSeriesData = EowDataStruct.prepareTimeSeriesChartData(data);
  }

  static getFUColours() {
    const cArray = Object.keys(colors);
    return cArray.map(c => {
      const index = (parseInt(c, 10)) % cArray.length;
      // console.log(`colors length: ${cArray.length}, c: ${c}, color index: ${index}`);
      return colors[index].replace(')', ` , ${opaqueness})`);
    });
  }

  draw(elementId: string, sizeScaleFactor: number) {
    console.log(`time series chart - draw at ${elementId} - ${this.timeSeriesData}`);

    const width = widthFactor * sizeScaleFactor;
    const fontSize = 0.8 * sizeScaleFactor;
    const fontWeight = 20;
    const theFUColours = TimeSeriesChartHTML.getFUColours();

    const dateParser = timeParse('%Y-%m-%dT%H:%M:%SZ');
    const xAccessor = d => dateParser(d.date);
    // const metricAccessor = d => d.date;
    const yAccessor = d => d.fu;

    // Delete any existing pie-chart that existed in the elementId
    select('#' + elementId).select('svg').remove();

    const dimensions = {
      width,
      height: 150,
      margin: {
        top: 15,
        right: 15,
        bottom: 40,
        left: 60
      },
      boundedWidth: 0,
      boundedHeight: 0
    };

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const wrapper = select('#' + elementId)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height + 20);

    const bounds = wrapper.append('g').style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px`);

    const xScale = scaleTime()
      .domain(extent<TimeSeriesItem, Date>(this.timeSeriesData, xAccessor))
      .range([0, dimensions.boundedWidth]);
    // .nice();

    const yScale = scaleLinear()
      .domain([1, 21])
      .range([dimensions.boundedHeight, 0]);

    const lineGenerator = line<TimeSeriesItem>()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)));

    const graphLine = bounds.append('path')
      .attr('d', lineGenerator(this.timeSeriesData))
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 1);

    const yAxisGenerator = axisLeft<any>(yScale); // .tickValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]); // .scale();
    const yAxis = bounds.append('g').call(yAxisGenerator)
      .style('transform', `translateX(0px)`)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    const xAxisGenerator = axisBottom(xScale);
    const xAxis = bounds.append('g').call(xAxisGenerator)
      .style('transform', `translateY(${dimensions.boundedHeight}px)`)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    console.log(`dimensions.boundedHeight: ${dimensions.boundedHeight}`);
    console.log(`  translateY(${dimensions.boundedHeight}px)`)

    const out = lineGenerator(this.timeSeriesData);
    console.log(`dataOut: ${JSON.stringify(out)}`);

    this.timeSeriesData.forEach(d => console.log(`  date: ${xAccessor(d)}, fu: ${yAccessor(d)}`));

    // --------------------
    // const group = bounds.append('g');
    //
    // const groups = group.selectAll('g')
    //   .data(this.timeSeriesData)
    //   .enter()
    //   .append('g');


  }


}
