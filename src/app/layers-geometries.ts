import {
  Feature as TurfFeature,
  Polygon,
} from '@turf/helpers';
import {Brolog} from 'brolog';
import {EowLayers} from './eow-layers';
import {Injectable} from '@angular/core';
import {EowBaseService} from './eow-base-service';

/**
 * We need to determine the Waterbodies (defined through various other layers) and the contained EOW Data so we can perform actions on
 * EOW Data in same waterbody.  Such as a Pie Graph.  This class manages the Geometries of the layers that define water bodies.
 */
// TODO i don't think this is being used anymore - however the geometry-ops.specs uses it and I don't want to change things this close to the end :)
@Injectable()
export default class LayerGeometries extends EowBaseService {
  layerFeatures: { [name: string]: TurfFeature<Polygon>[] } = {};  // Each Layer passed to createGeometry() has multiple polygons

  constructor(private eowLayers: EowLayers, private log: Brolog) {
    super();
  }

  destroy() {
    super.destroy();
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
