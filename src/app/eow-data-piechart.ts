import {Feature, FeatureCollection, Point} from '@turf/helpers';
import {featureEach, featureReduce} from '@turf/meta';
import Brolog from 'brolog';
import GeometryOps, {EowWaterbodyIntersection} from './geometry-ops';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';

import {EOWMap} from './eow-map';
import {PieChart} from './pie-chart';

const theClass = `EOWDataPieChart`;
const htmlElementId = 'waterbody';
const LOG2 = Math.log(2);

type Coords = [number, number];

export default class EOWDataPieChart {
  pieChartMap: any;
  eowMap: EOWMap;
  htmlDocument: Document;

  constructor(private geometryOps: GeometryOps, private pieChart: PieChart, private log: Brolog) { }

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
  plot(eowDataInWaterbodies: EowWaterbodyIntersection[]) { // FeatureCollection<Point>[]) {
    /*
      1. Loop through array of Waterbody polygons
      2. If the FeatureCollection has property 'geometry'
      3. Get the centroid of the polygon
      4. Draw something at that point
     */
    this.eowMap.mapObs.asObservable().subscribe(map => {
      for (const eowWaterbodyIntersection of eowDataInWaterbodies) {
        // These eowWaterbodyIntersection are between the EOW Data Points and the polygons in the chosen layer (selected outside of here with
        //  the result being passed in as EowWaterbodyIntersection[].
        // Each Object is:
        //  waterBody: <the polygon that represents the waterbody>
        //  eowData: <the EOW Data points within that waterbody>
        //
        // If there is no EOWData within the waterbody, both fields will be null

        const points: Coords[] = [];
        if (eowWaterbodyIntersection.waterBody) {
          this.log.verbose(theClass + '.plot', `eowWaterbodyIntersection.waterBody: ${JSON.stringify(eowWaterbodyIntersection.waterBody.polygon, null, 2)}`);
          featureEach(eowWaterbodyIntersection.waterBody.polygon, (feature: Feature<Point>) => {
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
            this.draw(eowDataInWaterbodies, centroid, map);
          } else {
            this.log.verbose(theClass + '.plot', 'No Centroid to draw at');
          }
        }
      }
    });
  }

  /**
   * Draw an overlay with pie chart at the point given for the data point representing FU values.
   *
   * @param point where to draw
   */
  draw(eowDataInWaterbodies: EowWaterbodyIntersection[], point: number[], map: Map) {
    const validData = eowDataInWaterbodies.map(e => e.eowData).filter(f => f !== null);
    if (validData.length > 0 && point[0] && point[1] && !isNaN(point[0]) && !isNaN(point[1])) {
      this.log.info(theClass, `Draw pieChart at ${point[0]}, ${point[1]})}`);
      const el = this.htmlDocument.createElement('div');
      // const img = this.htmlDocument.createElement('img');
      const id = 'pieChart-' + Math.floor(Math.random() * 100000);
      el.setAttribute('id', id);
      // img.src = 'https://www.gravatar.com/avatar/0dbc9574f3382f14a5f4c38a0aec4286?s=20';
      // el.appendChild(img);
      this.htmlDocument.getElementById(htmlElementId).appendChild(el);
      this.pieChart.drawD3(validData, id, map.getView().getZoom() * LOG2, point);
      const pieChartMap = new Overlay({
        element: el,
        position: point,
        autoPan: true,
        autoPanMargin: 275,
        positioning: OverlayPositioning.TOP_LEFT
      });
      map.addOverlay(pieChartMap);
      map.on('moveend', (evt) => {
        // force a redraw so as to change size if zoom in / out
        this.pieChart.drawD3(validData, id, map.getView().getZoom() * LOG2, point);
      });
    } else {
      this.log.info(theClass, `NOT Drawing pieChart at "${point[0]}", "${point[1]}")}`);
    }
  }
}
