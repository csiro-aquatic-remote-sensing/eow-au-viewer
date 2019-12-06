import LinearRing from 'ol/geom/LinearRing';
// import {Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon} from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import {Feature, Point, point as pointFn} from '@turf/helpers';
// import jsts from 'jsts';

// declare var jsts: any;  // https://github.com/bjornharrtell/jsts

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the geometries of the EOW Data.  It extracts the point data.
 */

const WFS_URL = 'https://geoservice.maris.nl/wms/project/eyeonwater_australia?service=WFS'
  + '&version=1.0.0&request=GetFeature&typeName=eow_australia&maxFeatures=5000&outputFormat=application%2Fjson';

export default class EowDataGeometries {
  points: Feature<Point, any>[] = [];

  constructor() {
    fetch(WFS_URL).then((response) => {
      return response.json();
    }).then((json) => {
      const format = new GeoJSON();
      const features = format.readFeatures(json, {featureProjection: 'EPSG:3857'});

      features.forEach(feature => {
        const point = feature.getGeometry().getCoordinates();
        this.points.push(pointFn(point));
      });
      // const parser = new jsts.io.OL3Parser();
      // parser.inject(Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon);
      //
      // // for (let i = 0; i < features.length; i++) {
      // this.features.forEach(feature => {
      //   // const feature = features[i];
      //   // convert the OpenLayers geometry to a JSTS geometry
      //   const jstsGeom = parser.read(feature.getGeometry());
      //
      //   // create a buffer of 40 meters around each line
      //   // const buffered = jstsGeom.buffer(40);
      //
      //   // convert back from JSTS and replace the geometry on the feature
      //   feature.setGeometry(parser.write(jstsGeom));
      // });


      console.log(`EOWDataGeometries - ${JSON.stringify(this.points)}`);
    });
  }
}
