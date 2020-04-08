import { Injectable } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import VectorLayer from 'ol/layer/Vector';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import {DateTime} from 'luxon';
import {Coords} from '../../eow-data-struct';
import {EowBaseService} from '../../eow-base-service';
import {EowDataLayer} from '../../eow-data-layer';
import Brolog from 'brolog';
import {UserService} from '../users/user.service';

let performOnce = true;

export interface MeasurementsType {
  coordinate: Coords;
  code: string;
  img: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class MeasurementsService extends EowBaseService {
  private _measurements: Feature[];
  private initialMeasurements: Feature[];
  private measurementsById: {};
  private measurementsByOwner: {};
  private _measurementsList: MeasurementsType[];
  private allDataSource: VectorSource;
  private _dataLayer: VectorLayer;

  constructor(private eowData: EowDataLayer, private log: Brolog) {
    super();
  }

  get measurements() {
    return this._measurements;
  }

  get measurementsList() {
    return this._measurementsList;
  }

  get dataLayer() {
    return this._dataLayer;
  }

  destroy() {
    super.destroy();
  }

  init() {
    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      if (allDataSource) {
        this.allDataSource = allDataSource;
        if (!this.initialMeasurements && this._measurements) {
          this.initialMeasurements = this._measurements.slice(0);  // duplicate
        }
        this.initialLoadMeasurements(allDataSource.getFeatures());
      }
    }));
    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this._dataLayer = dataLayer;
    }));
  }


  private initialLoadMeasurements(features: Feature[]) {
    if (features && features.length) {
      performOnce = false;

      console.log(`initialLoadMeasurements - #: ${features.length}`);
      // Store the measurements in easy to access data structure
      this._measurements = features;
      this.measurementsById = keyBy(features, f => f.get('n_code'));
      this.measurementsByOwner = groupBy(features, f => f.get('user_n_code'));

      this.recentMeasurements(this._measurements);
    }
  }

  resetMeasurements() {
    this.recentMeasurements(this.initialMeasurements);
    this.showUserMeasurements();
  }

  getByOwner(userId) {
    return this.measurementsByOwner.hasOwnProperty(userId) && this.measurementsByOwner[userId] || [];
  }

  getById(id) {
    return this.measurementsById[id] || [];
  }

  getMeasurementsListlength() {
    return this._measurementsList ? this._measurementsList.length : 0;
  }

  private recentMeasurements(measurements: Feature[], n = 50) {
    this._measurementsList = orderBy(measurements, [(f) => (new Date(f.get('date_photo'))).getTime()], ['desc']).slice(0, n).map((measurement) => {
      const prettyDate = DateTime.fromISO(measurement.get('date_photo')).toLocaleString(DateTime.DATE_FULL);

      return {coordinate: measurement.getGeometry().getCoordinates(),
        code: measurement.get('n_code'),
        img: 'https://eyeonwater.org/grfx/icons/small/' + measurement.get('fu_value') + '.png',
        date: prettyDate};
    });
  }

  showUserMeasurements(userId = null) {
    const userMeasurements: Feature[] = this.getByOwner(userId);
    console.log(`measurment store - selection of this # features: ${userMeasurements.length}`);
    this.recentMeasurements(userMeasurements);
    return userMeasurements.length > 0;
  }

  /**
   * Succinct summary of measurements data for debugging and also a field showing if the referenced user exists
   * @param byOwner: true or byId if false
   */
  measurementSummary(byOwner: boolean, userService: UserService) {
    const measurementsByOwnerOrId = byOwner ? this.measurementsByOwner : this.measurementsById;
    const ids = Object.keys(measurementsByOwnerOrId);
    const results = {};
    ids.forEach(k => {
      if (byOwner) {
        results[k] = measurementsByOwnerOrId[k].map(m => {
          return {
            // n_code: m.get('n_code'),
            user_n_code: m.get('user_n_code'),
            user_exists: userService.userExists(m.get('user_n_code')),
            image: m.get('image')
          };
        });
      } else {
        results[k] = {
          // n_code: measurementsByOwnerOrId[k].get('n_code'),
          user_n_code: measurementsByOwnerOrId[k].get('user_n_code'),
          user_exists: userService.userExists(measurementsByOwnerOrId[k].get('user_n_code')),
          image: measurementsByOwnerOrId[k].get('image')
        };
      }
    });
    return results;
  }

  /**
   * Debug information showing the users with measurements, if they exist in the Users Store and how many measurments they have.
   *
   * @param userService to do the lookup
   */
  numberMeasurmentsPerUser(userService: UserService) {
    const ids = Object.keys(this.measurementsByOwner);
    const results = {};
    ids.forEach(k => {
      results[k] = {
        // user_n_code: [k],
        user_exists: userService.userExists(k),
        number_measurements: this.measurementsByOwner[k].length
      };
    });
    return results;
  }
}
