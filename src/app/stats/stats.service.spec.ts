import {TestBed} from '@angular/core/testing';
import {feature, Feature as TurfFeature} from '@turf/helpers';
import GeoJSON from 'ol/format/GeoJSON';
import {EowDataLayer} from '../eow-data-layer';
import {EOWMap} from '../eow-map';
import Brolog from 'brolog';
import {HeaderStatsService} from './stats.header.service';

const statsService = new HeaderStatsService();
const format = new GeoJSON();

describe('Stats.ServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [EowDataLayer, EOWMap, Brolog]
  }));

  it('should be created', () => {
    const service: HeaderStatsService = TestBed.get(HeaderStatsService);
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
      expect(statsService.stats.avgFU).toBe(16);
    });

    it(`test global, australia - australia`, (done) => {
      const features = buildFeatures([{fu_value: 17, application: 'australia'}, {fu_value: 15, application: 'australia'}]);
      statsService.calculateStats(features);
      expect(statsService.stats.eowAu).toBe(2);
      expect(statsService.stats.eowGlobal).toBeUndefined();
    });
  });

  it(`test global, australia - global`, (done) => {
    const features = buildFeatures([{fu_value: 17, application: 'elsewhere'}, {fu_value: 15, application: 'elsewhere'}]);
    statsService.calculateStats(features);
    expect(statsService.stats.eowAu).toBeUndefined();
    expect(statsService.stats.eowGlobal).toBe(2);
  });

  it(`test global, australia - both`, (done) => {
    const features = buildFeatures([{fu_value: 17, application: 'australia'}, {fu_value: 15, application: 'elsewhere'}]);
    statsService.calculateStats(features);
    expect(statsService.stats.eowAu).toBe(1);
    expect(statsService.stats.eowGlobal).toBe(1);
  });
});
