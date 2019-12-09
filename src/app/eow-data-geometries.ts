import LinearRing from 'ol/geom/LinearRing';
// import {Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon} from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import {
  Feature, FeatureCollection, Point, point as turfPoint,
  featureCollection as turfFeatureCollection, feature as turfFeature
} from '@turf/helpers';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the geometries of the EOW Data.  It extracts the point data.
 */

const WFS_URL = 'https://geoservice.maris.nl/wms/project/eyeonwater_australia?service=WFS'
  + '&version=1.0.0&request=GetFeature&typeName=eow_australia&maxFeatures=5000&outputFormat=application%2Fjson';

export default class EowDataGeometries {
  points: FeatureCollection;

  constructor() {
  }

  async init() {
    fetch(WFS_URL).then((response) => {
      return response.json();
    }).then((json) => {
        const format = new GeoJSON();
        const features = format.readFeatures(json, {featureProjection: 'EPSG:3857'});
        // const theTurfFeature = turfFeature(features);
        // this.points = featureCollectionFn(features.slice(0, 1));  // todo DEBUG DEBUG
        const turfFeatures: Feature[] = [];
        // features.foreach(feature => {
        for (let i = 0; i < features.length; ++i) {
          const feature = features[i];
          const a = feature.getGeometry().getCoordinates();
          const b: Feature<Point> = turfPoint(a);
          // const c = turfFeature(b)
          turfFeatures.push(a);
        }
        // );
        this.points = turfFeatureCollection(turfFeatures);

        console.log(`EOWDataGeometries - ${JSON.stringify(this.points)}`);
      }
    );
  }
}
