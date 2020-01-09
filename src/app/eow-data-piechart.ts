import {Feature, FeatureCollection, Point} from '@turf/helpers';
import {featureEach, featureReduce} from '@turf/meta';
import clustersKmeans from '@turf/clusters-kmeans';
import Brolog from 'brolog';
import GeometryOps, {EowWaterbodyIntersection} from './geometry-ops';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

const theClass = `EOWDataPieChart`;
const htmlElementId = 'waterbody';

type Coords = [number, number];

export default class EOWDataPieChart {
  log: Brolog;
  geometryOps: GeometryOps;
  pieChartMap: any;
  map: Map;
  htmlDocument: Document;

  constructor(geometryOps: GeometryOps, log: Brolog) {
    this.geometryOps = geometryOps;
    this.log = log;
  }

  init(map: Map, htmlDocument) {
    this.map = map;
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
        if (points.length > 1) {
          this.log.verbose(theClass + '.plot', `EOWDatum points: ${JSON.stringify(points)}`);
          const median = this.geometryOps.calculateCentroidFromPoints(points);
          this.log.verbose(theClass + '.plot', `Median: ${JSON.stringify(median)}`);
          this.draw(median.geometry.coordinates);
        }
      }
    }
  }

  draw(points: number[]) {
    // Add a new overlay each time this is called
    if (points[0] !== null && points[1] !== null && !isNaN(points[0]) && !isNaN(points[1])) {
      this.log.info(theClass, `Draw pieChart at ${points[0]}, ${points[1]})}`);
      // if (!this.pieChartMap) {
      //   this.pieChartMap = new Overlay({
      const el = this.htmlDocument.createElement('div');
      const img = this.htmlDocument.createElement('img');
      el.setAttribute('id', '' + Math.random() * 1000);
      img.src = 'https://www.gravatar.com/avatar/0dbc9574f3382f14a5f4c38a0aec4286?s=20';
      el.appendChild(img);
      this.htmlDocument.getElementById(htmlElementId).appendChild(el);
      const pieChartMap = new Overlay({
        element: el,
        position: points,
        autoPan: true,
        autoPanMargin: 275,
        positioning: OverlayPositioning.CENTER_LEFT
      });
      this.map.addOverlay(pieChartMap);

      // pieChartMap.setPosition(points);
    }
  }

  // if (! this.pieChartMap) {
  // this.pieChartMap = new Overlay({
  // const container = this.htmlDocument.createElement('div');
  // container.id = '' + Math.random() * 1000;
  // const pieChartMap = new Overlay({
  //   element: this.htmlDocument.getElementById(htmlElementId),
  //   position: points,
  //   autoPan: true,
  //   autoPanMargin: 275,
  //   positioning: OverlayPositioning.CENTER_LEFT
  // });
  // this.map.addOverlay(pieChartMap);
  // const img = this.htmlDocument.createElement('img');
  // img.src = 'https://www.gravatar.com/avatar/0dbc9574f3382f14a5f4c38a0aec4286?s=60';
  // img.width = 20;
  // container.appendChild(img);
  // this.htmlDocument.getElementById(htmlElementId).appendChild(container);

}
