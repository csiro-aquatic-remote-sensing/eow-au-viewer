import {Feature, Point, lineString, FeatureCollection} from '@turf/helpers';
import {featureEach} from '@turf/meta';
import Brolog from 'brolog';
import GeometryOps from './geometry-ops';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import GeoJSON from 'ol/format/GeoJSON';

import {EOWMap} from './eow-map';
import {PieChart} from './pie-chart';
import {Layers} from './layers';
import {EowDataStruct, EowWaterBodyIntersection} from './eow-data-struct';

const theClass = `EOWDataPieChart`;
const htmlElementId = 'waterbody';
const LOG2 = Math.log(2);

type Coords = [number, number];

const debugDrawLines = true; // If true then draw line from center of pie chart to the features that the chart is for

export default class EOWDataPieChart {
  pieChartMap: any;
  eowMap: EOWMap;
  htmlDocument: Document;

  constructor(private geometryOps: GeometryOps, private pieChart: PieChart, private layers: Layers, private log: Brolog) { }

  init(eowMap: EOWMap, htmlDocument) {
    this.eowMap = eowMap;
    this.htmlDocument = htmlDocument;
  }

  private setupEventHandlers() {
  }

  /**
   * Perform some action on the EOW Data in waterbodies.  By default it is to draw a Pie Graph at the centroid of the polygon that
   * represents the water body.  The Pie chart is the FU values in that water body.
   * @param eowDataInWaterbodies - Polygons of waterbodies that contain EOW Points data
   */
  plot(eowDataInWaterbodies: EowWaterBodyIntersection[]) { // FeatureCollection<Point>[]) {
    /*
      1. Loop through array of Waterbody polygons
      2. If the FeatureCollection has property 'geometry'
      3. Get the centroid of the polygon
      4. Draw something at that point
     */
    let waterBodyIndex = 0;
    this.eowMap.mapObs.asObservable().subscribe(map => {
      for (const eowDataInWaterbody of eowDataInWaterbodies) {
        // These EowWaterBodyIntersection are between the EOW Data Points and the polygons in the chosen layer (selected outside of here with
        //  the result being passed in as EowWaterBodyIntersection[].
        // Each Object is:
        //  waterBody: <the polygon that represents the waterbody>
        //  eowData: <the EOW Data points within that waterbody>
        //
        // If there is no EOWData points within the waterbody, both fields will be null

        const points: Coords[] = [];
        if (eowDataInWaterbody.eowData) {
          this.log.verbose(theClass + '.plot', `EowWaterBodyIntersection.waterBody: ${JSON.stringify(eowDataInWaterbody.eowData, null, 2)}`);
          featureEach(eowDataInWaterbody.eowData, (feature: Feature<Point>) => {
            if (feature.hasOwnProperty('geometry')) {
              points.push(feature.geometry.coordinates as Coords);
            }
          });
          let centroid;
          if (points.length > 1) {
            this.log.verbose(theClass + '.plot', `EOWDatum points: ${JSON.stringify(points)}`);
            centroid = this.geometryOps.calculateCentroidFromPoints(points).geometry.coordinates;
          } else if (points.length === 1) {
            centroid = points[0];
          }
          if (centroid) {
            this.log.verbose(theClass + '.plot', `Centroid: ${JSON.stringify(centroid)}`);
            this.draw(eowDataInWaterbody.eowData, centroid, map, waterBodyIndex++);
          } else {
            this.log.verbose(theClass + '.plot', 'No Centroid to draw at');
          }
        }
      }
      console.log(`finished going through waterbodies`);
    });
  }

  /**
   * Draw an overlay with pie chart at the point given for the data point representing FU values.
   *
   * @param eowDataInWaterbodies - array of EOW Data that belongs to same water body
   * @param point where to draw - centroid of data (EOW Data points or Waterbody polygon points - I may change which is used sometime)
   * @param map to draw on
   * @param waterBodyIndex for DEBUG when line groups are drawn
   */
  draw(eowDataInWaterbody: FeatureCollection<Point>, point: Coords, map: Map, waterBodyIndex: number) {
    // const validData = eowDataInWaterbody.map(e => e.eowData).filter(f => f !== null);
    const validData: Feature<Point>[] = [];
    featureEach(eowDataInWaterbody, eowDataPoint => {
      if (eowDataPoint) {
        validData.push(eowDataPoint);
      }
    });
    if (validData.length > 0 && point[0] && point[1] && !isNaN(point[0]) && !isNaN(point[1])) {
      this.log.info(theClass, `Draw pieChart at ${point[0]}, ${point[1]})}`);
      const preparedChartData = EowDataStruct.prepareChartData(validData);
      const el = this.htmlDocument.createElement('div');
      const id = 'pieChart-' + Math.floor(Math.random() * 100000);
      el.setAttribute('id', id);
      this.htmlDocument.getElementById(htmlElementId).appendChild(el);
      this.pieChart.drawD3(preparedChartData, id, map.getView().getZoom() * LOG2);
      const pieChartMap = new Overlay({
        element: el,
        position: point,
        autoPan: true,
        autoPanMargin: 275,
        positioning: OverlayPositioning.CENTER_CENTER
      });
      map.addOverlay(pieChartMap);
      map.on('moveend', (evt) => {
        // force a redraw when change size due to zoom in / out
        this.pieChart.drawD3(preparedChartData, id, map.getView().getZoom() * LOG2);
      });
      this.drawDebugLines(point, preparedChartData, waterBodyIndex);
    } else {
      this.log.info(theClass, `NOT Drawing pieChart at "${point[0]}", "${point[1]}")}`);
    }
  }

  /**
   * Debug method that draws lines from the point where the Pie Chart is drawn to each EOWData point.
   *
   * @param point where the Pie Chart is drawn (the centroid of the EOW Data points)
   * @param preparedChartData that contains the points of hte EOWData
   * @param index as may get lots of the same name
   */
  private async drawDebugLines(point: Coords, preparedChartData: any, index: number) {
    if (debugDrawLines) {
      const allEOWDataPoints = () => {
        return preparedChartData.flatMap(p => p.y.points.map(p2 => p2));
      };
      const prefix = Math.floor(Math.random() * 10000);
      const format = new GeoJSON();
      const lineFeatures = allEOWDataPoints().map(p => {
        this.log.info(theClass, `Draw chart to EOWData line: ${JSON.stringify(point)}, ${JSON.stringify(p)}`);
        const ls = lineString([point, p], {name: 'FUChart to EOWData line'});
        this.log.info(theClass, `  LineString: ${JSON.stringify(ls)}`);
        const lsFeature = format.readFeature(ls, {
          featureProjection: 'EPSG:4326'
        });
        return lsFeature;
      });
      await this.layers.createLayerFromWFSFeatures('Lines ' + index, lineFeatures);
    }
  }
}
