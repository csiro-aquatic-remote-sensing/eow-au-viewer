import {chart, Color, SeriesPieOptions, setOptions, map as highchartsMap} from 'highcharts';
import colors from './colors.json';
import {
  Brolog,
} from 'brolog';
import {HttpClient} from '@angular/common/http';
import * as d3 from 'd3';

const theClass = 'PieChart';

export class PieChart {
  elementId = 'pieChart';
  highchart: any;

  constructor(private log: Brolog) {
  }

  /**
   * If features are passed in (since one or more clicked on) then draw PieChart containing them.  If it is empty then draw chart of all
   * features visible.
   *
   * @param elementId - id of Element to draw chart in to
   * @param features - EOW Data
   * @param coordinate - the position of the mouse click in the viewport
   */
  drawHighchart(features) {
    if (this.highchart) {
      this.highchart.destroy();
      this.highchart = null;
    } else {
      const theFUColours = this.getFUColours();

      // console.table(theFUColours);

      setOptions({
        colors: highchartsMap(theFUColours, (color) => {
          return {
            radialGradient: {
              cx: 0.5,
              cy: 0.3,
              r: 0.7
            },
            stops: [
              [0, color],
              [1, new Color(color).brighten(-0.2).get('rgb')] // darken
            ]
          };
        })
      });
    }

    const eowData = this.prepareData(features);

    // Build the chart
    this.highchart = chart(this.elementId, {
      chart: {
        plotBackgroundColor: 'rgba(55, 255, 255, 0)',
        plotBorderWidth: 0,
        plotShadow: false,
        type: 'pie',
        height: '80px',
        width: 90
      },
      title: {
        text: ''  // FUIs on selected markers'
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            connectorColor: 'brown'
          }
        }
      },
      series: [{
        data: eowData
      } as SeriesPieOptions]
    });
  }

  drawD3(features) {
    const width = 80;
    const pieWidth = 0.9
    const dataset = this.prepareData(features);
    const theFUColours = this.getFUColours();
    // this.elementId
    const numberSlices = dataset.length;
    const iconAccessor = d => d.label;
    // const datasetByIcon = d3.nest()
    //   .key(iconAccessor)
    //   .entries(dataset)
    //   .sort((a, b) => {
    //     b.count - a.count
    //   });
    const combinedDatasetByIcon = dataset;  // ByIcon;
    //   [
    //   ...datasetByIcon.slice(0, numberSlices),
    //   {
    //     key: "other",
    //     values: d3.merge(datasetByIcon.slice(numberSlices).map(d => d.values))
    //   }
    // ]

    // 2. Create chart dimensions

    console.log(`${JSON.stringify(combinedDatasetByIcon, null, 2)}`);
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

    const wrapper = d3.select('#' + this.elementId)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const bounds = wrapper.append('g')
      .style('transform', `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

    // 4. Create scales

    const arcGenerator = d3.pie()
      .padAngle(0.005)
      .value(d => d.y); // .length);

    const arcs = arcGenerator(combinedDatasetByIcon);

    const interpolateWithSteps = numberOfSteps => new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));
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
      .text('bono');  // d => d.data.name);

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
      .attr('transform', `translate(0, 10)`)
      .attr('style', 'fill: #000000; stroke: #000000');
  }

  getFUColours() {
    const cArray = Object.keys(colors);
    return cArray.map(c => {
      const index = (parseInt(c, 10)) % cArray.length;
      // console.log(`colors length: ${cArray.length}, c: ${c}, color index: ${index}`);
      return colors[index];
    });
  }

  /**
   *  Draw the pie chart of FU values selected, but the printStats() where the Pie Chart exists is used in other places
   *  Highcharts places its charts into an element with an id.  And as we know you can only have one id (since we only want one graph).
   *  Change the class to id in this one place.
   * @param html that contains 'class="pieChart"'
   */
  fixForThisPieChart(html: string) {
    return html.replace('class="pieChart"', 'id="pieChart"');
  }

  prepareData(features): any {
    const aggregateFUValues = (fuValuesInFeatures) => {
      const eowDataReducer = (acc, currentValue) => {
        if (currentValue.values_ && currentValue.values_.fu_value) {
          acc[currentValue.values_.fu_value] = acc.hasOwnProperty(currentValue.values_.fu_value) ? ++acc[currentValue.values_.fu_value] : 1;
        }
        return acc;
      };
      return features.reduce(eowDataReducer, {});
    };
    // Add zeros for all the other FUs since the colours in Highcharts pie charts are from the ordinal number of the data, NOT the value
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
    // Actually want this for Highcharts (if use)
    // const addMissingFUValues = (existingFUs, missingFUs) => {
    //   Object.keys(colors).forEach((key, index) => {
    //     if (!missingFUs.hasOwnProperty(index)) {
    //       existingFUs[index] = 0;
    //     }
    //   });
    //   return existingFUs;
    // };

    const eowDataFUValues = aggregateFUValues(features);
    const arrayFUValues = setMissingFUsToZero(eowDataFUValues);
    const arrayFUValuesObj = arrayToObject(arrayFUValues);

    // eowDataFUValues = addMissingFUValues(eowDataFUValues, arrayFUValuesObj);

    const eowData = Object.keys(arrayFUValuesObj).map(k => {
      return {name: k, y: eowDataFUValues[k]};
    });
    this.log.verbose(theClass, `EOWData: ${JSON.stringify(eowData)}`);
    return eowData;
  }
}
