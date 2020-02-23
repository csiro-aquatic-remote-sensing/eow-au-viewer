import {fromLonLat} from 'ol/proj';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import Map from 'ol/Map';

import {Coords} from '../eow-data-struct';
import Brolog from 'brolog';
import {Layers} from '../layers';

const htmlElementId = 'waterbody';
export const LOG2 = Math.log(2);

export abstract class ChartContainer {
  // TODO - define this type
  protected preparedData: any[];

  private htmlDocument: Document;
  protected point: Coords;
  protected map: Map;
  protected id: string;
  protected log: Brolog;
  protected layerName: string;
  protected layers: Layers;

  /**
   * Abstract class for the business related functions surrounding drawing charts on map.
   *
   * @param htmlDocument to draw in to
   * @param point to draw chart at
   * @param map to draw in to
   * @param id of div to draw in to
   * @param data to make up chart to draw
   */
  constructor(layerName: string, layers: Layers, log: Brolog) {
    this.log = log;
    this.layerName = layerName;
    this.layers = layers;
  }

  init(htmlDocument: Document, point: Coords, map: Map, id: string, data: any[]) {
    this.htmlDocument = htmlDocument;
    this.point = point;
    this.map = map;
    this.id = id;

    this.preparedData = this.getBuildPrepareData(data);

    return this;
  }

  /**
   * Method to perform the drawing of chart calling out to abstract buildPrepareData() to prepare the data in format required for chart
   * and abstract drawChartOfType to perform the actual drawing
   */
  draw() {
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
  }

  /**
   * The specific chart types define this to prepare the data in the format their chart type requires.
   *
   * @param data passed in to the constructor
   */
  abstract getBuildPrepareData(data: any): any;

  /**
   * The specific chart defines this to perform the actual drawing of chart
   */
  abstract drawChartOfType();
}
