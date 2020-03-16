import {ChartContainer, LOG2} from './chart-container';
import {PieChart} from './pie-chart';
import {Coords, EowDataStruct, PieItems} from '../eow-data-struct';
import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import {lineString as turfLineString} from '@turf/helpers';
import Brolog from 'brolog';
import {ApplicationLayers} from '../layers';
import {TimeSeriesChartContainer} from './time-series-chart-container';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';

const theClass = 'PieChartContainer';

const debugDrawLines = true; // If true then draw line from center of pie chart to the features that the chart is for

export class PieChartContainer extends ChartContainer {
  constructor(layerName: string, layers: ApplicationLayers, log: Brolog) {
    super(layerName, layers, log);
  }

  init(htmlDocument: Document, sideBarMessagingService: Subject<SideBarMessage>, point: Coords, map: Map, id: string, data: any[]) {
    return super.init(htmlDocument, sideBarMessagingService, point, map, id, data);
  }

  // TODO type this data
  getBuildPrepareData(data: any): PieItems {
    return EowDataStruct.preparePieChartData(data);
  }

  async drawChartOfType() {
    PieChart.drawD3(this.preparedData, this.id, this.map.getView().getZoom() * LOG2);

    this.setupEvents(this.id);
    await this.drawDebugLines(this.point, this.preparedData, this.layerName);
  }

  private setupEvents(elementId: string) {
    this.htmlDocument.querySelector('#' + elementId).addEventListener('click', (event) => {
      console.log(`Clicked pieChart with id: ${elementId}`);
      // new TimeSeriesChartContainer(layerName, this.layers, this.log).init(this.htmlDocument, this.offSet(point, 1), map, idTime, validData).draw();
      this.sideBarMessagingService.next({action: 'draw', message: 'timeSeriesChart', data: {rawData: this.data, scale: this.map.getView().getZoom() * LOG2}});
    });
  }

  /**
   * Debug method that draws lines from the point where the Pie Chart is drawn to each EOWData point.
   *
   * @param point where the Pie Chart is drawn (the centroid of the EOW Data points)
   * @param preparedChartData that contains the points of hte EOWData
   * @param index as may get lots of the same name
   */
  private async drawDebugLines(point: Coords, preparedChartData: any, layerName: string) {
    if (debugDrawLines) {
      const allEOWDataPoints = () => {
        return preparedChartData.flatMap(p => p.y.points.map(p2 => p2));
      };
      const format = new GeoJSON();
      const lineFeatures = allEOWDataPoints().map(p => {
        this.log.silly(theClass, `Draw chart to EOWData line: ${JSON.stringify(point)}, ${JSON.stringify(p)}`);
        const ls = turfLineString([point, p], {name: 'FUChart to EOWData line'});
        const lsFeature = format.readFeature(ls, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326'
        });
        return lsFeature;
      });
      // console.log(`drawDebugLines - ${JSON.stringify(lineFeatures, null, 2)}`);
      await this.layers.createLayerFromWFSFeatures(lineFeatures, {
        visible: true, layerDisplayName: `Lines for ${layerName}`, layerGroupName: 'Dev features'
      }, null);
    }
  }
}
