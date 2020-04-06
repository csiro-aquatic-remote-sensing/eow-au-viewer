import { TestBed } from '@angular/core/testing';
import {feature, Feature as TurfFeature} from '@turf/helpers';
import { StatsService } from './stats.base.service';
import GeoJSON from 'ol/format/GeoJSON';
import {EowDataLayer} from '../eow-data-layer';
import {EOWMap} from '../eow-map';
import Brolog from 'brolog';

const statsService = new StatsService(null);
const format = new GeoJSON();

describe('Stats.ServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [EowDataLayer, EOWMap, Brolog]
  }));

  it('should be created', () => {
    const service: StatsService = TestBed.get(StatsService);
    expect(service).toBeTruthy();
  });

  const buildFeatures = (properties) => {
    const features = [];
    for (const p of properties) {
      features.push(format.readFeature(feature(null, p)));
    }
    return features;
  };
  describe('calculateStats', () => {
    it(`test fu_value`, (done) => {
      const features = buildFeatures([{fu_value: 17}, {fu_value: 15}]);
      statsService.calculateStats(features);
      statsService.statsObs.subscribe(stats => {
        expect(stats.avgFU).toBe(16);
        done();
      });
    });

    it(`test global, australia - australia`, (done) => {
      const features = buildFeatures([{fu_value: 17, application: 'australia'}, {fu_value: 15, application: 'australia'}]);
      statsService.calculateStats(features);
      const sub = statsService.statsObs.subscribe(stats => {
        expect(stats.eowAu).toBe(2);
        expect(stats.eowGlobal).toBeUndefined();
        done();
      });
      sub.unsubscribe();
    });

    it(`test global, australia - global`, (done) => {
      const features = buildFeatures([{fu_value: 17, application: 'elsewhere'}, {fu_value: 15, application: 'elsewhere'}]);
      statsService.calculateStats(features);
      const sub = statsService.statsObs.subscribe(stats => {
        expect(stats.eowAu).toBeUndefined();
        expect(stats.eowGlobal).toBe(2);
        done();
      });
      sub.unsubscribe();
    });

    it(`test global, australia - both`, (done) => {
      const features = buildFeatures([{fu_value: 17, application: 'australia'}, {fu_value: 15, application: 'elsewhere'}]);
      statsService.calculateStats(features);
      const sub = statsService.statsObs.subscribe(stats => {
        expect(stats.eowAu).toBe(1);
        expect(stats.eowGlobal).toBe(1);
        done();
      });
      sub.unsubscribe();
    });
  });
});
