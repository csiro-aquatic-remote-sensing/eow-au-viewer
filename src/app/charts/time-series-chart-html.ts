import {EowDataStruct, TimeSeriesItem, TimeSeriesItems} from '../eow-data-struct';
import {select} from 'd3-selection';
import {scaleTime, scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {timeParse, timeFormat} from 'd3-time-format';
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

  constructor(private htmlDocument: Document, private data: any) {
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

    const dateTimeFormat = '%Y-%m-%dT%H:%M:%SZ';
    const dateParser = timeParse('%Y-%m-%dT%H:%M:%SZ');
    const dateFormatter = timeFormat(dateTimeFormat);
    const xAccessor = d => dateParser(d.date);
    // const metricAccessor = d => d.date;
    const yAccessor = d => d.fu;

    const container = this.htmlDocument.getElementById(elementId);
    const rect = container.getBoundingClientRect();

    // Delete any existing pie-chart that existed in the elementId
    select('#' + elementId).select('svg').remove();

    const dimensions = {
      width: rect.width,
      height: rect.width * 0.4,
      margin: {
        top: 15,
        right: 15,
        bottom: 20,
        left: 20
      },
      boundedWidth: 0,
      boundedHeight: 0
    };

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const wrapper = select('#' + elementId)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      // .attr('width', '100%')
      // .attr('height', '100%')
      // .attr('viewBox', '0 0 ' + Math.min(dimensions.width, dimensions.height) + ' ' + Math.min(dimensions.width, dimensions.height))
      // .attr('preserveAspectRatio', 'none')
      // .append('g')
      // .attr('transform', 'translate(' + Math.min(dimensions.width, dimensions.height) / 2 + ',' + Math.min(dimensions.width, dimensions.height) / 2 + ')');

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

    const yAxisGenerator = axisLeft<any>(yScale);
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

    const labelFU = wrapper.append('text')
      .style('transform', `translate(${dimensions.boundedWidth / 2 - 10}px, 15px)`)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')      .text('FU over time');
    const out = lineGenerator(this.timeSeriesData);
    console.log(`dataOut: ${JSON.stringify(out)}`);

    this.timeSeriesData.forEach(d => console.log(`  date: ${dateFormatter(xAccessor(d))}, fu: ${yAccessor(d)}`));

    // --------------------
    // const group = bounds.append('g');
    //
    // const groups = group.selectAll('g')
    //   .data(this.timeSeriesData)
    //   .enter()
    //   .append('g');


  }


}
