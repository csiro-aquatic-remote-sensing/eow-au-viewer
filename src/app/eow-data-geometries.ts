import GeoJSON from 'ol/format/GeoJSON';
import {Feature, FeatureCollection, featureCollection as turfFeatureCollection, point as turfPoint, Point} from '@turf/helpers';

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
        const geoJSONFeatures = new GeoJSON().readFeatures(json, {featureProjection: 'EPSG:3857'});
        const features: Feature[] = [];
        for (const feature of geoJSONFeatures) {
          const featurePoint: Feature<Point> = turfPoint(feature.getGeometry().getCoordinates(), feature);
          features.push(featurePoint);
        }
        this.points = turfFeatureCollection(features);

        console.log(`EOWDataGeometries - ${JSON.stringify(this.points)}`);
      }
    );
  }
}
