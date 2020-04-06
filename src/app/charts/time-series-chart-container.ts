import {ChartContainer, LOG2} from './chart-container';
import {PieChart} from './pie-chart';
import {Coords, EowDataStruct, TimeSeriesItems} from '../eow-data-struct';
import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import {lineString as turfLineString} from '@turf/helpers';
import Brolog from 'brolog';
import {ApplicationLayers} from '../layers';
import {TimeSeriesChartMap} from './time-series-chart-map';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';
import Feature from 'ol/Feature';

const theClass = 'PieChartContainer';

const debugDrawLines = true; // If true then draw line from center of pie chart to the features that the chart is for

export class TimeSeriesChartContainer extends ChartContainer {
  constructor(layerName: string, layers: ApplicationLayers, log: Brolog) {
    super(layerName, layers, log);
  }

  init(htmlDocument: Document, sideBarMessagingService: Subject<SideBarMessage>, point: Coords, map: Map, id: string, data: any[]) {
    return super.init(htmlDocument, sideBarMessagingService, point, map, id, data);
  }

  // TODO type this data
  getBuildPrepareData(data: Feature[]): TimeSeriesItems {
    return EowDataStruct.prepareTimeSeriesChartData(data);
  }

  drawChartOfType() {
    TimeSeriesChartMap.draw(this.preparedData, this.id, this.map.getView().getZoom() * LOG2);
  }
}
