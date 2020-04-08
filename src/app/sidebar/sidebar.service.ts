import {Inject, Injectable} from '@angular/core';
import Brolog from 'brolog';
import {DOCUMENT} from '@angular/common';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';
import {EowBaseService} from '../eow-base-service';
import {EowDataStruct, PieItem} from '../eow-data-struct';
import Feature from 'ol/Feature';

const show = true;
const hide = false;

@Injectable()
export default class SideBarService extends EowBaseService {
  private _pieChartPreparedData: PieItem[];
  private _timeSeriesRawData: Feature[];
  sideBarMessagingService: Subject<SideBarMessage>;

  constructor(private log: Brolog, @Inject(DOCUMENT) private htmlDocument: Document) {
    super();
  }

  destroy() {
    super.destroy();
  }

  async init(sideBarMessagingService: Subject<SideBarMessage>): Promise<SideBarService> {
    this.sideBarMessagingService = sideBarMessagingService;

    this.subscriptions.push(this.sideBarMessagingService.asObservable().subscribe(msg => {
      this.handleMessage(msg);
    }));

    this.setupEventHandlers();

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
    this.showHideMenu('eow-timeline', show);
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

  private setupEventHandlers() {
    this.htmlDocument.getElementById('eow-timeline').addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement);
      if (element.matches('.close')) {
        this.sideBarMessagingService.next({action: 'close', message: 'eow-timeline'});
      }
    });
  }

  // If I need this again it will need to be moved to somewhere else to avoid circular dependency
  // private debug_compareUsersNMeasurements(allDataSource) {
  //   if (false && isDebugLevel() && allDataSource) {
  //     this.log.verbose(this.constructor.name, 'debug_compareUsersNMeasurements:');
  //     this.userService.getUserByIdKeys().forEach(uid => {
  //       const user = this.userService.getUserById(uid);
  //       this.log.verbose(this.constructor.name, `  user - Id: ${user.id}, nickName: ${user.nickname}, photo_count: ${user.photo_count}`);
  //       const m = null; // this.measurementStore.getByOwner(user.id);
  //       if (m && m.length > 0) {
  //         const images = m.map(m2 => m2.get('image'));
  //         this.log.verbose(this.constructor.name, `    number of images: ${images.length} -> \n${JSON.stringify(images, null, 2)}`);
  //       }
  //     });
  //     // Now print Measurements info
  //     // this.log.verbose(this.constructor.name, `measurementsByOwner: ${
  //     //   JSON.stringify(this.measurementStore.measurementSummary(true, this.userStore), null, 2)}`);
  //     // this.log.verbose(this.constructor.name, `measurementsById: ${
  //     //   JSON.stringify(this.measurementStore.measurementSummary(false, this.userStore), null, 2)}`);
  //     // this.log.verbose(this.constructor.name, `Number of measurements per user: ${
  //     //   JSON.stringify(this.measurementStore.numberMeasurmentsPerUser(this.userStore), null, 2)}`);
  //   }
  // }
}
