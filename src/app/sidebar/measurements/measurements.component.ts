import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {EowBaseService} from '../../eow-base-service';
import {EOWMap} from '../../eow-map';
import {EowDataLayer} from '../../eow-data-layer';
import Brolog from 'brolog';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import {Feature} from 'ol';
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import {DateTime} from 'luxon';
import {UserStore} from '../user-store';
import {Coords} from '../../eow-data-struct';
import {Coordinate} from 'ol/coordinate';
import {AnimationOptions} from 'ol/View';
import {DOCUMENT} from '@angular/common';

let performOnce = true;

interface MeasurementsType {
  coordinate: Coords;
  code: string;
  img: string;
  date: string;
};

@Component({
  selector: 'app-measurements',
  templateUrl: './measurements.component.html',
  styleUrls: ['./measurements.component.css']
})
export class MeasurementsComponent extends EowBaseService implements OnInit, OnDestroy {
  private measurements: Feature[];
  private initialMeasurements: Feature[];
  private measurementsById: {};
  private measurementsByOwner: {};
  private measurementsList: MeasurementsType[];
  private allDataSource: VectorSource;
  private dataLayer: VectorLayer;
  private map: Map;

  constructor(private eowMap: EOWMap, private eowData: EowDataLayer,
              private log: Brolog, @Inject(DOCUMENT) private htmlDocument: Document) { // , private userStore: UserStore
    super();
  }

  ngOnDestroy() {
    super.destroy();
  }

  ngOnInit() {
    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      this.allDataSource = allDataSource;
      if (! this.initialMeasurements && this.measurements) {
        this.initialMeasurements = this.measurements.slice(0);  // duplicate
      }
      this.initialLoadMeasurements(allDataSource);
      // this.setupEventHandling();  // this.userStore);
    }));
    this.subscriptions.push(this.eowMap.getMap().subscribe(map => {
      this.map = map;
    }));
    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.htmlDocument.querySelector('.measurement-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      if (!element) {
        return;
      }

      const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseFloat(c)) as Coordinate;
      console.log(`Clicked on Measurement List - coord: ${coordinate}`)
      const view = this.map.getView();
      view.cancelAnimations();
      view.animate({
        center: coordinate,
        zoom: 14,
        duration: 1300
      } as AnimationOptions);
    }, true);

    this.htmlDocument.getElementById('resetButton').addEventListener('click', (event) => {
      this.resetMeasurments();
    });

  }

  private initialLoadMeasurements(source: VectorSource) {
    if (source) {
      performOnce = false;
      // const source = event.target;
      const features = source.getFeatures();
      console.log(`initialLoadMeasurements - #: ${features.length}`)
      // Store the measurements in easy to access data structure
      this.measurements = features;
      this.measurementsById = keyBy(features, f => f.get('n_code'));
      this.measurementsByOwner = groupBy(features, f => f.get('user_n_code'));

      this.recentMeasurements(this.measurements);
      this.showMeasurments(source);
      // this.allDataSource.un('change', this.initialLoadMeasurements.bind(this, userStore));
      // console.log(`loadMeasurements (by Id): ${JSON.stringify(Object.keys(this.measurementsById))}`);
      // console.log(`loadMeasurements (by Owner): ${JSON.stringify(Object.keys(this.measurementsByOwner))}`);
      // }
    }
  }

  private resetMeasurments() {
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
    return this.measurementsList ? this.measurementsList.length : 0;
  }

  private recentMeasurements(measurements, n = 50) {
    this.measurementsList = orderBy(measurements, [(f) => (new Date(f.get('date_photo'))).getTime()], ['desc']).slice(0, n).map((measurement) => {
      const prettyDate = DateTime.fromISO(measurement.get('date_photo')).toLocaleString(DateTime.DATE_FULL);

      return {coordinate: measurement.getGeometry().getCoordinates(),
        code: measurement.get('n_code'),
        img: "https://eyeonwater.org/grfx/icons/small/" + measurement.get('fu_value') + '.png',
        date: prettyDate};

      // const itemTemplate = ` <li class="item measurement-item" data-coordinate="${measurement.getGeometry().getCoordinates()}"` +
      //   `data-key="${measurement.get('n_code')}"><img src="https://eyeonwater.org/grfx/icons/small/` +
      //   `${measurement.get('fu_value')}.png"> ${prettyDate}</li>`;
      // return itemTemplate;
    });

    // document.querySelector('.measurement-list ul').innerHTML = userList.join('\n');
  }

  showUserMeasurements(userId = null) {
    const selection = this.getByOwner(userId);
    if (!selection.length) {
      return false;
    }
    const newSource = new VectorSource();
    newSource.addFeatures(selection);
    this.showMeasurments(newSource);
    if (this.dataLayer) {
      this.dataLayer.setSource(newSource);
    }
    console.log(`measurment store - selection of this # features: ${selection.length}`);
    this.recentMeasurements(selection);
    return true;
  }

  private showMeasurments(source: VectorSource) {
    this.map.getView().fit(source.getExtent(), {
      size: this.map.getSize(),
      padding: [100, 100, 100, 100],
      nearest: false,
      duration: 1300
    });
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
