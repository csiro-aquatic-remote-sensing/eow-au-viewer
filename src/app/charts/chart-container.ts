import {fromLonLat} from 'ol/proj';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import Map from 'ol/Map';

import {Coords} from '../eow-data-struct';
import Brolog from 'brolog';
import {ApplicationLayers} from '../layers';
import {EowBaseService} from '../eow-base-service';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';
import Feature from 'ol/Feature';

const htmlElementId = 'waterbody';
export const LOG2 = Math.log(2);

export abstract class ChartContainer extends EowBaseService {
  // TODO - define this type
  protected preparedData: any[];

  protected htmlDocument: Document;
  protected point: Coords;
  protected map: Map;
  protected id: string;
  protected log: Brolog;
  protected layerName: string;
  protected layers: ApplicationLayers;
  protected data: any;
  protected sideBarMessagingService: Subject<SideBarMessage>;

  /**
   * Abstract class for the business related functions surrounding drawing charts on map.
   *
   * @param htmlDocument to draw in to
   * @param point to draw chart at
   * @param map to draw in to
   * @param id of div to draw in to
   * @param data to make up chart to draw
   */
  protected constructor(layerName: string, layers: ApplicationLayers, log: Brolog) {
    super();
    this.log = log;
    this.layerName = layerName;
    this.layers = layers;
  }

  init(htmlDocument: Document, sideBarMessagingService: Subject<SideBarMessage>, point: Coords, map: Map, id: string, data: Feature[]) {
    this.htmlDocument = htmlDocument;
    this.sideBarMessagingService = sideBarMessagingService;
    this.point = point;
    this.map = map;
    this.id = id;

    this.data = data;
    this.preparedData = this.getBuildPrepareData(data);

    return this;
  }

  /**
   * Method to perform the drawing of chart calling out to abstract buildPrepareData() to prepare the data in format required for chart
   * and abstract drawChartOfType to perform the actual drawing
   */
  draw(clickCallback: () => void) {
    const el = this.htmlDocument.createElement('div');
    el.setAttribute('id', this.id);
    this.htmlDocument.getElementById(htmlElementId).appendChild(el);
    // PieChart.drawD3(this.data, this.id, this.map.getView().getZoom() * LOG2);
    this.drawChartOfType();
    const chartMap = new Overlay({
      element: el,
      position: this.point, // Note that the view is EPSG:4326 (Lon, Lat)
      autoPan: true,
      autoPanMargin: 275,
      positioning: OverlayPositioning.CENTER_CENTER
    });
    this.map.addOverlay(chartMap);
    this.map.on('moveend', (evt) => {
      // force a redraw when change size due to zoom in / out
      // PieChart.drawD3(this.data, this.id, this.map.getView().getZoom() * LOG2);
      this.drawChartOfType();
    });
    this.setupEvents(clickCallback);
  }

  private setupEvents(clickCallback: () => void) {
    this.htmlDocument.querySelector('#' + this.id).addEventListener('click', (event) => {
      console.log(`Clicked pieChart with id: ${this.id} and run clickCallback()`);
      clickCallback();
      // new TimeSeriesChartContainer(layerName, this.layers, this.log).init(this.htmlDocument, this.offSet(point, 1), map, idTime, validData).draw();
      // this.sideBarMessagingService.next({action: 'draw', message: 'timeSeriesChart', data: {rawData: this.data, scale: this.map.getView().getZoom() * LOG2}});
      // this.sideBarMessagingService.next({action: 'show', message: 'eow-dataPoint-information', data: {features: this.data, coordinate: null}});
    });

  }

  /**
   * The specific chart types define this to prepare the data in the format their chart type requires.
   *
   * @param data passed in to the constructor
   */
  abstract getBuildPrepareData(data: Feature[]): any;

  /**
   * The specific chart defines this to perform the actual drawing of chart
   */
  abstract drawChartOfType();
}
