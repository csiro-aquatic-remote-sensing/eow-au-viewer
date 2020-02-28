import {
  Feature as TurfFeature,
  lineString,
  multiLineString,
  Polygon,
  polygon,
  multiPolygon,
  FeatureCollection,
  featureCollection as turfFeatureCollection
} from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import GeoJSONFeature from 'ol/format/Feature';
import OLGeoJson from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import {Brolog} from 'brolog';
import {FeatureLike} from 'ol/Feature';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import {EowLayers, LayersInfo} from './eow-layers';
import GeoJSON from 'ol/format/GeoJSON';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the Geometries of the layers that define water bodies.
 */

export default class LayerGeometries {
  layerFeatures: { [name: string]: TurfFeature<Polygon>[] } = {};  // Each Layer passed to createGeometry() has multiple polygons

  constructor(private eowLayers: EowLayers, private log: Brolog) {
  }

  private mapNames(name: string): string {
    return name.replace(/\s+/, '_');
  }

  getLayer(name: string): any {
    const newName = this.mapNames(name);

    if (this.layerFeatures.hasOwnProperty(newName)) {
      return this.layerFeatures[newName];
    } else {
      throw new Error(`Requested layer doesnt exist: "${name}"`);
    }
  }
}
