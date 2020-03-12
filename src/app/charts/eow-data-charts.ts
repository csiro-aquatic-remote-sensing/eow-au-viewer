import {
  Feature,
  Point,
  lineString as turfLineString,
  FeatureCollection
} from '@turf/helpers';
import {featureEach} from '@turf/meta';
import Brolog from 'brolog';
import GeometryOps from '../geometry-ops';
import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';

import {EOWMap} from '../eow-map';
import {ApplicationLayers, redLines} from '../layers';
import {EowDataStruct, EowWaterBodyIntersection, SourcePointMarginsType} from '../eow-data-struct';
import {PieChartContainer} from './pie-chart-container';
import {TimeSeriesChartContainer} from './time-series-chart-container';
import {Injectable} from '@angular/core';

const theClass = `EOWDataCharts`;

type Coords = [number, number];

@Injectable()
export default class EowDataCharts {
  /**
   * Only create pie charts once.
   */
  chartMap: {[name: string]: boolean} = {};
  map: Map;
  htmlDocument: Document;
  ids: { [id: string]: boolean } = {};

  constructor(private layers: ApplicationLayers, private log: Brolog) {
  }

  init(eowMap: EOWMap, htmlDocument) {
    this.htmlDocument = htmlDocument;
    eowMap.getMap().subscribe(map => {
      this.map = map;
    });
  }

  private setupEventHandlers() {
  }

  /**
   * Perform some action on the EOW Data in waterbodies.  For example, draw charts at the centroid of the polygon that
   * represents the water body.  The charts are for the FU values in that water body.
   * @param eowDataInWaterbodies - Polygons of waterbodies and EOWData in that waterbody
   */
  // TODO - this should be async
  plotCharts(eowDataInWaterbodies: EowWaterBodyIntersection[], layerName: string) { // FeatureCollection<Point>[]) {
    /*
      1. Loop through array of Waterbody polygons
      2. If the FeatureCollection has property 'geometry'
      3. Get the centroid of the polygon
      4. Draw something at that point
     */
    let waterBodyIndex = 0;
    for (const eowDataInWaterbody of eowDataInWaterbodies) {
      // These EowWaterBodyIntersection are between the EOW Data Points and the polygons in the chosen layer (selected outside of here with
      //  the result being passed in as EowWaterBodyIntersection[].
      // Each Object is:
      //  waterBody: <the polygon that represents the waterbody>
      //  eowData: <the EOW Data points within that waterbody>
      //
      // If there is no EOWData points within the waterbody, the eowData field will be null
      const points: Coords[] = [];
      if (eowDataInWaterbody.eowData) {
        this.log.silly(theClass + '.plot', `EowWaterBodyIntersection.waterBody: ${JSON.stringify(eowDataInWaterbody.eowData, null, 2)}`);
        featureEach(eowDataInWaterbody.eowData, (feature: Feature<Point>) => {
          if (feature.hasOwnProperty('geometry')) {
            points.push(feature.geometry.coordinates as Coords);
          }
        });
        let centroid;
        if (points.length > 1) {
          this.log.silly(theClass + '.plot', `EOWDatum points: ${JSON.stringify(points)}`);
          centroid = GeometryOps.calculateCentroidFromPoints(points).geometry.coordinates;
        } else if (points.length === 1) {
          centroid = points[0];
        }
        if (centroid) {
          this.log.verbose(theClass + '.plot', `Centroid: ${JSON.stringify(centroid)}`);
          this.drawCharts(eowDataInWaterbody.eowData, centroid, this.map, waterBodyIndex++, layerName);
        } else {
          this.log.verbose(theClass + '.plot', 'No Centroid to draw at');
        }
      }
    }
    this.log.verbose(theClass, `finished going through waterbodies`);
  }

  /**
   * Draw an overlay with pie chart at the point given for the data point representing FU values.
   *
   * @param eowDataInWaterbodies - array of EOW Data that belongs to same water body
   * @param point where to draw - centroid of data (EOW Data points or Waterbody polygon points - I may change which is used sometime)
   * @param map to draw on
   * @param waterBodyIndex for DEBUG when line groups are drawn
   */
  drawCharts(eowDataInWaterbody: FeatureCollection<Point>, point: Coords, map: Map, waterBodyIndex: number, layerName: string) {
    // TODO - type this data (all the way through)
    const validData: any[] = [];
    featureEach(eowDataInWaterbody, eowDataPoint => {
      if (eowDataPoint) {
        validData.push(eowDataPoint.properties);
      }
    });
    // Using pointToPrecision to make unique Id from 6 decimal places as sometimes the maths can be ~ .0000001 off
    const uniqueChartIdForPosition = EowDataStruct.createPointSting(EowDataStruct.pointToPrecision(point));
    if (! this.chartMap.hasOwnProperty(uniqueChartIdForPosition)) {
      if (validData.length > 0 && point[0] && point[1] && !isNaN(point[0]) && !isNaN(point[1])) {
        const idPie = this.createId('pieChart-');
        const idTime = this.createId('timeSeriesChart-');
        this.log.verbose(theClass, `Draw pieChart ${idPie} at ${JSON.stringify(point)}`);
        new PieChartContainer(layerName, this.layers, this.log).init(this.htmlDocument, point, map, idPie, validData).draw();
        new TimeSeriesChartContainer(layerName, this.layers, this.log).init(this.htmlDocument, this.offSet(point, 1), map, idTime, validData).draw();
        this.chartMap[uniqueChartIdForPosition] = true;
      } else {
        this.log.verbose(theClass, `NOT Drawing pieChart at ${JSON.stringify(point)})} - data not valid or complete`);
      }
    } else {
      this.log.verbose(theClass, `NOT Drawing pieChart at ${JSON.stringify(point)})} - chart already exists`);
    }
  }

  // TODO move to a util
  /**
   * Create a unique id for each new HTML element
   * @param prefix in the id
   */
  private createId(prefix: string) {
    for (; ;) {
      const id = prefix + Math.floor(Math.random() * 100000);
      if (!this.ids.hasOwnProperty(id)) {
        this.ids[id] = true;
        return id;
      }
    }
  }

  /**
   * Offset subsequent charts so they don't appear on exactly the same spot.
   *
   * @param amount as multiplier
   */
  private offSet(point: Coords, amount: number): Coords {
    return point.map(p => p + (amount * .02)) as Coords;
  }

  /**
   * ErrorMarginPoints are points around the EOW Data points.  Draw them so can see this is working.
   *
   * @param errorMarginPoints to draw
   */
  async drawErrorMarginPoints(pointsMap: SourcePointMarginsType[]) {
    const format = new GeoJSON();
    const errorMarginPoints = {
      features: [],  // Array<Feature<Point, Properties>>,
      type: 'FeatureCollection'
    };
    pointsMap.map(e => {
      const source = e.sourcePoint;
      e.margins.features.map(m => {
        const ls = turfLineString([source.geometry.coordinates, m.geometry.coordinates]);
        const lsFeature = format.readFeature(ls, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326'
        });
        errorMarginPoints.features.push(lsFeature);
      });
    });
    await this.layers.createLayerFromWFSFeatures(errorMarginPoints.features, {
      style: redLines,
      visible: false,
      layerDisplayName: `Error margin lines`,
      layerGroupName: 'Dev features'
    }, null);
  }
}
