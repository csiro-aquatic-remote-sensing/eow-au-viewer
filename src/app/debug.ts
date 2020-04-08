/***** DEBUG *****/

import {brologLevel, isDebugLevel} from './globals';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import {Feature as turfFeature, FeatureCollection, Point} from '@turf/helpers';
import {EowWaterBodyIntersection} from './eow-data-struct';
import {WaterBodyFeatures} from './types';
import Feature from 'ol/Feature';
import {Brolog} from 'brolog';

const log = Brolog.instance(brologLevel);  // InjectorInstance.get<Brolog>(Brolog);

export class Debug {
  static debug_printFirstEOWData(allDataSource) {
    if (isDebugLevel()) {
      if (isDebugLevel() && allDataSource) {
        const features = allDataSource.getFeatures();
        const point = features.length > 0 ? (features[0].getGeometry() as SimpleGeometry).getFirstCoordinate() : 'no data yet';
        log.silly(Debug.name, `First EOWData point: ${point}`);
      }
    }
  }


  static debugWaterBodyFeatures(waterBodyFeatures: WaterBodyFeatures, layerName: string) {
    if (isDebugLevel()) {
      console.log(`debugWaterBodyFeatures for layerName: ${layerName}`);
      waterBodyFeatures[layerName].forEach(f => {
        log.silly(Debug.name, f.getProperties()['image']);
      });
    }
  }

  static debugFeatureCollection(points: FeatureCollection<Point>, debugSource: string) {
    if (isDebugLevel()) {
      const newDebugSource = `${debugSource} -> debugFeatureCollection ->`;
      log.silly(Debug.name, `  ${newDebugSource}`);
      if (points) {
        points.features.forEach(f => {
          log.silly(Debug.name, f.properties.values_.image);
        });
        Debug.debugImageCount(points.features, newDebugSource);
      }
    }
  }

  static debugImageCount(features: Array<turfFeature>, debugSource: string) {
    if (isDebugLevel()) {
      const result = {};
      features.forEach(f => {
        const image = f.properties.values_.image.replace(/^.*?eyeonwater_upload\//, '');
        if (result.hasOwnProperty(image)) {
          result[image]++;
        } else {
          result[image] = 1;
        }
      });
      log.silly(Debug.name, `    ${debugSource} debugImageCount -> ${JSON.stringify(result, null, 2)}`);
    }
  }

  static debugEowWaterBodyIntersections(eowWaterBodyIntersections: EowWaterBodyIntersection[], debugSource: string) {
    if (isDebugLevel()) {
      const newDebugSource = `${debugSource} -> debugEowWaterBodyIntersections ->`; // CCC
      log.silly(Debug.name, `${newDebugSource}`);
      eowWaterBodyIntersections.forEach(e => {
        log.silly(Debug.name, `  waterbody: ${e.waterBody.name}`);
        Debug.debugFeatureCollection(e.eowData, newDebugSource);
      });
    }
  }

  static debugFeaturesByImages(features: Feature[]) {
    if (isDebugLevel()) {
      features.sort((fa, fb) =>
        (fa.getProperties().image - fb.getProperties().image))
        .forEach(f => log.silly(Debug.name, f.getProperties().image));
    }
  }
}
