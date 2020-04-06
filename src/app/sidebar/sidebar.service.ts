import {Inject, Injectable} from '@angular/core';
import Map from 'ol/Map';

import {EowDataLayer} from '../eow-data-layer';
// import {MeasurementStore} from './measurement-store';
// import {UserStore} from './user-store';
import {isDebugLevel} from '../globals';
import Brolog from 'brolog';
import {Coordinate} from 'ol/coordinate';
import {AnimationOptions} from 'ol/View';
import {DOCUMENT} from '@angular/common';
import VectorLayer from 'ol/layer/Vector';
import {EOWMap} from '../eow-map';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';
import {EowBaseService} from '../eow-base-service';
import {TimeSeriesChartHTML} from '../charts/time-series-chart-html';
import {UserStore} from './user-store';
import {MeasurementsService} from './measurements/measurements.service';
import {UserService} from './users/user.service';
import {EowDataStruct, PieItem} from '../eow-data-struct';
import Feature from 'ol/Feature';

const show = true;
const hide = false;

@Injectable()
export default class SideBarService extends EowBaseService {
  private _pieChartPreparedData: PieItem[];
  private _timeSeriesRawData: Feature[];
  dataLayer: VectorLayer;
  map: Map;
  sideBarMessagingService: Subject<SideBarMessage>;

  constructor(private eowData: EowDataLayer, private eowMap: EOWMap,
              private log: Brolog, @Inject(DOCUMENT) private htmlDocument: Document,
              private measurementsService: MeasurementsService, private userService: UserService) {
    // , private measurementStore: MeasurementStore, private userStore: UserStore
    super();
  }

  destroy() {
    super.destroy();
  }

  async init(sideBarMessagingService: Subject<SideBarMessage>): Promise<SideBarService> {
    this.sideBarMessagingService = sideBarMessagingService;
    // this.measurementStore.init();
    // await this.userStore.init();

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
        // this.measurementStore.initialLoadMeasurements(this.userStore, allDataSource);
        // allDataSource.un('change', this.measurementStore.initialLoadMeasurements.bind(this, this.userStore, allDataSource));

        // Debug
        allDataSource.on('change', this.debug_compareUsersNMeasurements.bind(this, allDataSource));

        this.setupEventHandlers(allDataSource);
      }
    }));

    return this;
  }

  // TODO - Move passing features and let the client prepare it, and then just pass the features in once here
  get pieChartPreparedData() {
    return this._pieChartPreparedData;
  }

  set timeSeriesRawData(features: Feature[]) {
    this._timeSeriesRawData = features;
  }

  get timeSeriesRawData() {
    return this._timeSeriesRawData;
  }

  async buildPieChartPreparedData(features: Feature[]) {
    this._pieChartPreparedData = await EowDataStruct.preparePieChartData(features);
  }

  /**
   * 'Message' to say a PieChart was clicked on, and we need to hide some menus and show others.  Want to see the charts.
   */
  setupToDisplayCharts() {
    this.showHideMenu('measurements', hide);
    this.showHideMenu('users', hide);
    this.showHideMenu('eow-dataPoint-information', show);
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

  private async show(menuId: string, {features, coordinate}: { [name: string]: any }) {
    switch (menuId) {
      case 'eow-dataPoint-information':
        console.log(`sidebar - show ${menuId}`);
        // await this.popup.draw(features, coordinate, 'eow-dataPoint-information');
        // this.showHideMenu('measurements', hide);
        // this.showHideMenu('users', hide);
        // this.showHideMenu('eow-dataPoint-information', show);
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

        // new TimeSeriesChartHTML(this.htmlDocument, data.rawData, this.log).draw('eow-timeline');
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown Item to draw: ${message}`);
    }
  }

  private setupEventHandlers(allDataSource) {
    // Measurement List
    // this.htmlDocument.querySelector('.measurement-list').addEventListener('click', (event) => {
    //   const element = (event.target as HTMLElement).closest('.item');
    //   if (!element) {
    //     return;
    //   }
    //
    //   const coordinate = element.getAttribute('data-coordinate').split(',').map(c => parseFloat(c)) as Coordinate;
    //   console.log(`Clicked on Measurement List - coord: ${coordinate}`)
    //   const view = this.map.getView();
    //   view.cancelAnimations();
    //   view.animate({
    //     center: coordinate,
    //     zoom: 14,
    //     duration: 1300
    //   } as AnimationOptions);
    // }, true);

    // User List
    // this.htmlDocument.querySelector('.user-list').addEventListener('click', (event) => {
    //   const element = (event.target as HTMLElement).closest('.item');
    //   const selectedUserId = element.getAttribute('data-user');
    //   // console.log(`clicked on user-id: ${this.userStore.selectedUserId}`);
    //   if (false) { // this.measurementStore.showMeasurements(selectedUserId)) {
    //     // this.userStore.clearSelectedUser();
    //     // this.userStore.selectedUserId = selectedUserId;
    //     element.classList.add('selectedUser', 'box-shadow');
    //     this.toggleFilterButton(true);
    //   }
    // }, true);

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
    // this.userStore.clearSelectedUser();
    // this.measurementStore.clearFilter();
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
      this.userService.getUserByIdKeys().forEach(uid => {
        const user = this.userService.getUserById(uid);
        this.log.verbose(this.constructor.name, `  user - Id: ${user.id}, nickName: ${user.nickname}, photo_count: ${user.photo_count}`);
        const m = null; // this.measurementStore.getByOwner(user.id);
        if (m && m.length > 0) {
          const images = m.map(m2 => m2.get('image'));
          this.log.verbose(this.constructor.name, `    number of images: ${images.length} -> \n${JSON.stringify(images, null, 2)}`);
        }
      });
      // Now print Measurements info
      // this.log.verbose(this.constructor.name, `measurementsByOwner: ${
      //   JSON.stringify(this.measurementStore.measurementSummary(true, this.userStore), null, 2)}`);
      // this.log.verbose(this.constructor.name, `measurementsById: ${
      //   JSON.stringify(this.measurementStore.measurementSummary(false, this.userStore), null, 2)}`);
      // this.log.verbose(this.constructor.name, `Number of measurements per user: ${
      //   JSON.stringify(this.measurementStore.numberMeasurmentsPerUser(this.userStore), null, 2)}`);
    }
  }
}
