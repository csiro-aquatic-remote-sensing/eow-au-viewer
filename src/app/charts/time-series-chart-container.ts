import {ChartContainer, LOG2} from './chart-container';
import {Coords, EowDataStruct, TimeSeriesItems} from '../eow-data-struct';
import Map from 'ol/Map';
import Brolog from 'brolog';
import {ApplicationLayers} from '../layers';
import {TimeSeriesChartMap} from './time-series-chart-map';
import {Subject} from 'rxjs';
import Feature from 'ol/Feature';

export class TimeSeriesChartContainer extends ChartContainer {
  constructor(layerName: string, layers: ApplicationLayers, log: Brolog) {
    super(layerName, layers, log);
  }

  init(htmlDocument: Document, point: Coords, map: Map, id: string, data: any[]) {
    return super.init(htmlDocument, point, map, id, data);
  }

  // TODO type this data
  getBuildPrepareData(data: Feature[]): TimeSeriesItems {
    return EowDataStruct.prepareTimeSeriesChartData(data);
  }

  drawChartOfType() {
    TimeSeriesChartMap.draw(this.preparedData, this.id, this.map.getView().getZoom() * LOG2);
  }
}

