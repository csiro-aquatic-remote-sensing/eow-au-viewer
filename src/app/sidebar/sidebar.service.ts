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
import {TimeSeriesChartMap} from '../charts/time-series-chart-map';
import {TimeSeriesChartHTML} from '../charts/time-series-chart-html';

const show = true;
const hide = false;

@Injectable()
export default class SideBarService extends EowBaseService {
  dataLayer: VectorLayer;
  map: Map;
  private sideBarMessagingService: Subject<SideBarMessage>;

  constructor(private eowData: EowDataLayer, private eowMap: EOWMap, private measurementStore: MeasurementStore, private userStore: UserStore, private popup: Popup,
              private log: Brolog, @Inject(DOCUMENT) private htmlDocument: Document) {
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
      if (allDataSource) {
        this.measurementStore.initialLoadMeasurements(this.userStore, allDataSource);
        allDataSource.un('change', this.measurementStore.initialLoadMeasurements.bind(this, this.userStore, allDataSource));

        // Debug
        allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this, allDataSource));

        this.setupEventHandlers(allDataSource);
      }
    }));

    return this;
  }

  private handleMessage(msg: SideBarMessage) {
    switch (msg.action) {
      case 'show':
        this.show(msg.message, msg.data);
        break;
      case 'close':
        this.close(msg.message);
        break;
      case 'draw':
        this.draw(msg.message, msg.data);
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown sidebarMessage action: ${msg.action}`);
    }
  }

  private show(menuId: string, {features, coordinate}: { [name: string]: any }) {
    switch (menuId) {
      case 'eow-dataPoint-information':
        console.log(`sidebar - show ${menuId}`);
        this.popup.draw(features, coordinate, 'eow-dataPoint-information');
        this.showHideMenu('measurements', hide);
        this.showHideMenu('users', hide);
        this.showHideMenu('eow-dataPoint-information', show);
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown menId to show: ${menuId}`);
    }
  }

  private showHideMenu(menuId: string, showIt: boolean) {
    const menuItem = this.htmlDocument.getElementById(menuId);
    // menuItem.style.display = showIt ? 'block' : 'none';
    menuItem.classList.remove(showIt ? 'hidden' : 'show');
    menuItem.classList.add(showIt ? 'show' : 'hidden');
  }

  private close(menuId: string) {
    switch (menuId) {
      case 'eow-dataPoint-information':
      case 'eow-timeline':
        this.showHideMenu('measurements', show);
        this.showHideMenu('users', show);
        this.showHideMenu('eow-dataPoint-information', hide);
        this.showHideMenu('eow-timeline', hide);
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown menId to close: ${menuId}`);
    }
  }

  /**
   * Draw charts in to the sidebar
   *
   * @param message about what to draw
   * @param data for what to draw
   */
  private draw(message: string, data: { [p: string]: any }) {
    switch (message) {
      case 'timeSeriesChart':
        this.showHideMenu('measurements', hide);
        this.showHideMenu('users', hide);
        this.showHideMenu('eow-dataPoint-information', show);
        this.showHideMenu('eow-timeline', show);

        new TimeSeriesChartHTML(this.htmlDocument, data.rawData, this.log).draw('eow-timeline');
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown Item to draw: ${message}`);
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

    this.htmlDocument.getElementById('eow-timeline').addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement);
      if (element.matches('.close')) {
        this.sideBarMessagingService.next({action: 'close', message: 'eow-timeline'});
      }
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
