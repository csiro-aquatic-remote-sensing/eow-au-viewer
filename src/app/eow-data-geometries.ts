import GeoJSON, {GeoJSONPoint} from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import {
  Feature,
  FeatureCollection,
  featureCollection as turfFeatureCollection, Geometry as turfGeometry,
  GeometryCollection,
  point as turfPoint,
  Point
} from '@turf/helpers';
import {
  Brolog,
} from 'brolog';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

const theClass = 'EowDataGeometries';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the geometries of the EOW Data.  It extracts the point data.
 */

const WFS_URL = 'https://geoservice.maris.nl/wms/project/eyeonwater_australia?service=WFS'
  + '&version=1.0.0&request=GetFeature&typeName=eow_australia&maxFeatures=5000&outputFormat=application%2Fjson';

export default class EowDataGeometries {
  points: FeatureCollection<Point>;

  constructor(private log: Brolog) {
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(WFS_URL);
        const geoJSONFeatures = new GeoJSON().readFeatures(await response.json(), {featureProjection: 'EPSG:3857'});
        const features: Feature<Point>[] = [];
        // Should return a promise here
        for (const feature of geoJSONFeatures) {
          const simpleGeometry = feature.getGeometry() as SimpleGeometry;
          const featurePoint: Feature<Point> = turfPoint(simpleGeometry.getCoordinates(), feature);
          features.push(featurePoint);
        }
        this.points = turfFeatureCollection(features);

        this.log.silly(theClass, `EOWDataGeometries - ${JSON.stringify(this.points)}`);
      } catch (error) {
        this.log.error(error);
        reject(error);
      }
      resolve();
    });
  }
}
