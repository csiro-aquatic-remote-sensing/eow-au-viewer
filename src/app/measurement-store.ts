import orderBy from 'lodash/orderBy';
import {
  DateTime
} from 'luxon';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import {UserStore} from './user-store';
import Brolog from 'brolog';

export class MeasurementStore {
  measurements: [];
  measurementsById: {};
  measurementsByOwner: {};
  map: Map;
  dataLayer: any;
  allDataSource: any;
  log: Brolog;

  init(map: Map, dataLayer: any, allDataSource: any, log: Brolog) {
    this.map = map;
    this.dataLayer = dataLayer;
    this.allDataSource = allDataSource;
    this.log = log;
    this.setupEventHandling();
  }

  getByOwner(userId) {
    return this.measurementsByOwner.hasOwnProperty(userId) && this.measurementsByOwner[userId] || [];
  }

  getById(id) {
    return this.measurementsById[id] || [];
  }

  setupEventHandling() {
    this.allDataSource.on('change', this.initialLoadMeasurements.bind(this));
  }

  clearFilter() {
    this.recentMeasurements(this.measurements);
  }


  private recentMeasurements(measurements, n = 20) {
    const userList = orderBy(measurements, [(f) => (new Date(f.get('date_photo'))).getTime()], ['desc']).slice(0, n).map((measurement) => {
      const prettyDate = DateTime.fromISO(measurement.get('date_photo')).toLocaleString(DateTime.DATE_FULL);

      const itemTemplate = ` <li class="item measurement-item" data-coordinate="${measurement.getGeometry().getCoordinates()}"` +
        `data-key="${measurement.get('n_code')}"><img src="https://eyeonwater.org/grfx/icons/small/` +
        `${measurement.get('fu_value')}.png"> ${prettyDate}</li>`;
      return itemTemplate;
    });

    document.querySelector('.measurement-list ul').innerHTML = userList.join('\n');
  }

  initialLoadMeasurements(event) {
    const source = event.target;
    if (!source.loading) {
      const features = this.allDataSource.getFeatures();
      // Store the measurements in easy to access data structure
      this.measurements = features;
      this.measurementsById = keyBy(features, f => f.get('n_code'));
      this.measurementsByOwner = groupBy(features, f => f.get('user_n_code'));

      this.recentMeasurements(this.measurements);
      this.allDataSource.un('change', this.initialLoadMeasurements);
      // console.log(`loadMeasurements (by Id): ${JSON.stringify(Object.keys(this.measurementsById))}`);
      // console.log(`loadMeasurements (by Owner): ${JSON.stringify(Object.keys(this.measurementsByOwner))}`);
    }
  }

  showMeasurements(userId = null) {
    const selection = this.getByOwner(userId);
    if (!selection.length) {
      return false;
    }
    const newSource = new VectorSource();
    newSource.addFeatures(selection);
    this.map.getView().fit(newSource.getExtent(), {
      size: this.map.getSize(),
      padding: [100, 100, 100, 100],
      nearest: false,
      duration: 1300
    });
    this.dataLayer.setSource(newSource);
    this.recentMeasurements(selection);
    return true;
  }

  /**
   * Succinct summary of measurements data for debugging and also a field showing if the referenced user exists
   * @param byOwner: true or byId if false
   */
  measurementSummary(byOwner: boolean, userStore: UserStore) {
    const measurementsByOwnerOrId = byOwner ? this.measurementsByOwner : this.measurementsById;
    const ids = Object.keys(measurementsByOwnerOrId);
    const results = {};
    ids.forEach(k => {
      if (byOwner) {
        results[k] = measurementsByOwnerOrId[k].map(m => {
          return {
            // n_code: m.get('n_code'),
            user_n_code: m.get('user_n_code'),
            user_exists: userStore.userExists(m.get('user_n_code')),
            image: m.get('image')
          };
        });
      } else {
        results[k] = {
          // n_code: measurementsByOwnerOrId[k].get('n_code'),
          user_n_code: measurementsByOwnerOrId[k].get('user_n_code'),
          user_exists: userStore.userExists(measurementsByOwnerOrId[k].get('user_n_code')),
          image: measurementsByOwnerOrId[k].get('image')
        };
      }
    });
    return results;
  }

  /**
   * Debug information showing the users with measurements, if they exist in the Users Store and how many measurments they have.
   *
   * @param userStore to do the lookup
   */
  numberMeasurmentsPerUser(userStore: UserStore) {
    const ids = Object.keys(this.measurementsByOwner);
    const results = {};
    ids.forEach(k => {
      results[k] = {
        // user_n_code: [k],
        user_exists: userStore.userExists(k),
        number_measurements: this.measurementsByOwner[k].length
      };
    });
    return results;
  }
}
