import {Inject, Injectable} from '@angular/core';
import Map from 'ol/Map';

import {EowDataLayer} from '../eow-data-layer';
import {MeasurementStore} from './measurement-store';
import {UserStore} from './user-store';
import {isDebugLevel} from '../globals';
import Brolog from 'brolog';
import {Coordinate} from 'ol/coordinate';
import {AnimationOptions} from 'ol/View';
import {DOCUMENT} from '@angular/common';
import VectorLayer from 'ol/layer/Vector';
import {EOWMap} from '../eow-map';
import {Subject, Subscription} from 'rxjs';
import {SideBarMessage} from '../types';
import {EowBaseService} from '../eow-base-service';
import {Popup} from './popup';

@Injectable()
export default class SideBarService extends EowBaseService {
  dataLayer: VectorLayer;
  map: Map;
  private sideBarMessagingService: Subject<SideBarMessage>;

  constructor(private eowData: EowDataLayer, private eowMap: EOWMap, private measurementStore: MeasurementStore, private userStore: UserStore, private popup: Popup,
              private log: Brolog,
              @Inject(DOCUMENT) private htmlDocument: Document) {
    super();
  }

  destroy() {
    super.destroy();
  }

  async init(sideBarMessagingService: Subject<SideBarMessage>): Promise<SideBarService> {
    this.sideBarMessagingService = sideBarMessagingService;
    this.measurementStore.init(); // this.eowMap, this.eowData, this.userStore);
    await this.userStore.init();  // this.eowData, this.measurementStore);

    this.subscriptions.push(this.sideBarMessagingService.asObservable().subscribe(msg => {
      this.handleMessage(msg);
    }));

    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));

    this.subscriptions.push(this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    }));

    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      // TODO - do this through sidebar
      if (allDataSource) {
        // TODO - do this through sidebar
        this.measurementStore.initialLoadMeasurements(this.userStore, allDataSource);
        allDataSource.un('change', this.measurementStore.initialLoadMeasurements.bind(this, this.userStore, allDataSource));

        // Debug
        allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this, allDataSource));

        this.setupEventHandlers(allDataSource);
      }
    }));

    return this;
  }

  show(menu: string, {features, coordinate}: {[name: string]: any}) {
    console.log(`sidebar - show ${menu}`);
    this.popup.draw(features, coordinate, 'eow-dataPoint-information');
    const measurements = this.htmlDocument.getElementById('measurements');
    const users = this.htmlDocument.getElementById('users');
    measurements.style.display = 'none';
    users.style.display = 'none';
  }

  private handleMessage(msg: SideBarMessage) {
    if (msg.action === 'show') {
      this.show(msg.message, msg.data);
    }
  }

  private setupEventHandlers(allDataSource) {
    // Measurement List
    this.htmlDocument.querySelector('.measurement-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      if (!element) {
        return;
      }

      const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseInt(c, 10)) as Coordinate;
      const id = element.getAttribute('data-key');
      const view = this.map.getView();
      view.cancelAnimations();
      view.animate({
        center: coordinate,
        zoom: 8,
        duration: 1300
      } as AnimationOptions);
      const features = [this.measurementStore.getById(id)];
      // TODO - fix up this popup
      // this.popupObject.draw(features, coordinate);
    }, true);

    // User List
    this.htmlDocument.querySelector('.user-list').addEventListener('click', (event) => {
      const element = (event.target as HTMLElement).closest('.item');
      const selectedUserId = element.getAttribute('data-user');
      console.log(`clicked on user-id: ${this.userStore.selectedUserId}`);
      if (this.measurementStore.showMeasurements(selectedUserId)) {
        this.userStore.clearSelectedUser();
        this.userStore.selectedUserId = selectedUserId;
        element.classList.add('selectedUser', 'box-shadow');
        this.toggleFilterButton(true);
      }
    }, true);

    this.htmlDocument.getElementById('clearFilterButton').addEventListener('click', (event) => {
      this.clearFilter(allDataSource);
    });
  }

  private clearFilter(allDataSource) {
    this.userStore.clearSelectedUser();
    this.measurementStore.clearFilter();
    if (this.dataLayer) {
      this.map.getView().fit(this.dataLayer.getSource().getExtent(), {duration: 1300});
      if (allDataSource) {
        this.dataLayer.setSource(allDataSource);
      }
    }
    this.toggleFilterButton(false);
  }

  private toggleFilterButton(state = false) {
    const element = this.htmlDocument.getElementById('clearFilterButton');
    element.classList.toggle('hidden', !state);
  }

  private debug_compareUsersNMeasurements(allDataSource) {
    if (false && isDebugLevel() && allDataSource) {
      this.log.verbose(this.constructor.name, 'debug_compareUsersNMeasurements:');
      Object.keys(this.userStore.userById).forEach(uid => {
        const user = this.userStore.userById[uid];
        this.log.verbose(this.constructor.name, `  user - Id: ${user.id}, nickName: ${user.nickname}, photo_count: ${user.photo_count}`);
        const m = this.measurementStore.getByOwner(user.id);
        if (m && m.length > 0) {
          const images = m.map(m2 => m2.get('image'));
          this.log.verbose(this.constructor.name, `    number of images: ${images.length} -> \n${JSON.stringify(images, null, 2)}`);
        }
      });
      // Now print Measurements info
      this.log.verbose(this.constructor.name, `measurementsByOwner: ${
        JSON.stringify(this.measurementStore.measurementSummary(true, this.userStore), null, 2)}`);
      this.log.verbose(this.constructor.name, `measurementsById: ${
        JSON.stringify(this.measurementStore.measurementSummary(false, this.userStore), null, 2)}`);
      this.log.verbose(this.constructor.name, `Number of measurements per user: ${
        JSON.stringify(this.measurementStore.numberMeasurmentsPerUser(this.userStore), null, 2)}`);
    }
  }

}
