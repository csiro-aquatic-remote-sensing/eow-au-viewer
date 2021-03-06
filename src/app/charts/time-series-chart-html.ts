import {EowDataStruct, TimeSeriesItem, TimeSeriesItems} from '../eow-data-struct';
import {select} from 'd3-selection';
import {scaleTime, scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {timeParse, timeFormat} from 'd3-time-format';
import {line} from 'd3-shape';
import {axisLeft, axisBottom} from 'd3-axis';
import colors from '../colors.json';
import Brolog from 'brolog';
import Feature from 'ol/Feature';
import {brologLevel} from '../globals';

const opaqueness = 0.7;

const log = Brolog.instance(brologLevel);

export class TimeSeriesChartHTML {
  /**
   * Draw time series chart with FU values on vertical axis and date on horizontal in to elementId
   *
   * @param data to massage and draw chart from
   * @param elementId to draw in to
   */
  readonly timeSeriesData: TimeSeriesItems;

  constructor(private htmlDocument: Document, private data: Feature[]) {
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

  draw(elementId: string) {
    log.verbose(this.constructor.name, `time series chart - draw at ${elementId} - data length: ${this.timeSeriesData.length}`);

    const dateTimeFormat = '%Y-%m-%dT%H:%M:%SZ';
    const dateFormat = '%Y-%m-%d';
    const dateTimeParser = timeParse(dateTimeFormat);
    const dateTimeFormatter = timeFormat(dateTimeFormat);
    const dateFormatter = timeFormat(dateFormat);
    const xAccessor = d => dateTimeParser(d.date);
    // const metricAccessor = d => d.date;
    const yAccessor = d => d.fu;

    const container = this.htmlDocument.getElementById(elementId);
    const rect = container.getBoundingClientRect();

    // Delete any existing pie-chart that existed in the elementId
    select('#' + elementId).select('svg').remove();

    const dimensions = {
      width: rect.width,
      height: rect.width * 0.45,
      margin: {
        top: 15,
        right: 15,
        bottom: 40,
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
      .attr('height', dimensions.height);

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
      .attr('stroke', TimeSeriesChartHTML.getFUColours()[this.averageColour()])
      .attr('stroke-width', 1);

    const yAxisGenerator = axisLeft<any>(yScale);
    const yAxis = bounds.append('g').call(yAxisGenerator)
      .style('transform', `translateX(0px)`)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    const xAxisGenerator = axisBottom(xScale);

    // If created an 'artificial' 2nd entry (as only 1) then only write the date as the x-axis
    if (! (this.timeSeriesData.length === 2 && this.timeSeriesData[0].hasOwnProperty('comment') && this.timeSeriesData[0].comment === 'artificial')) {
      const xAxis = bounds.append('g').call(xAxisGenerator)
        .style('transform', `translateY(${dimensions.boundedHeight}px)`)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .selectAll('text')
        .attr('y', 0)
        .attr('x', 9)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(90)')
        .style('text-anchor', 'start');
    } else {
      const xAxisLabel = bounds.append('text')
        .style('transform', `translate(${dimensions.boundedWidth / 2 - 10}px, ${dimensions.boundedHeight}px)`)
        .style('text-anchor', 'middle')
        .style('fill', 'black')
        .style('font-size', '12px')
        .style('font-family', 'sans-serif')
        .text('date: ' + dateFormatter(dateTimeParser(this.timeSeriesData[0].date)));
    }

    const labelFU = wrapper.append('text')
      .style('transform', `translate(${dimensions.boundedWidth / 2 - 10}px, 15px)`)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .text('FU over time');

    this.timeSeriesData.forEach(d => log.silly(this.constructor.name, `  date: ${dateTimeFormatter(xAccessor(d))}, fu: ${yAccessor(d)}`));
  }

  /**
   * Return the average FU colour across the given timeSeries data
   */
  private averageColour() {
    const reducer = (acc, current) => acc + current.fu;
    const total = this.timeSeriesData.reduce(reducer, 0);
    return Math.round(total / this.timeSeriesData.length);
  }


}
