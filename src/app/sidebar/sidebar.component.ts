import {Component, Inject, Input, OnInit} from '@angular/core';
import SideBarService from './sidebar.service';
import {EowBaseService} from '../eow-base-service';
import {SideBarMessage} from '../types';
import Brolog from 'brolog';
import {Subject} from 'rxjs';
import {EowDataStruct, PieItem} from '../eow-data-struct';
import Feature from 'ol/Feature';
import {DOCUMENT} from '@angular/common';
import colors from '../colors.json';
import moment = require('moment-timezone/moment-timezone');
import {MeasurementsService} from './measurements/measurements.service';
import {UserService} from './users/user.service';
import {SidebarStatsService} from '../stats/stats.sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent extends EowBaseService implements OnInit {
  @Input() sideBarMessagingService: Subject<SideBarMessage>;
  // private _stats: Stats;
  _pieChartPreparedData: PieItem[];
  _timeSeriesRawData: Feature[];
  parentSelector = 'div#eow-dataPoint-information';

  constructor(private sideBarService: SideBarService, private measurementsService: MeasurementsService, private userService: UserService,
              private sidebarStatsService: SidebarStatsService, @Inject(DOCUMENT) private htmlDocument: Document, private log: Brolog) {
    super();
  }

  async ngOnInit() {
    this.subscriptions.push(this.sideBarMessagingService.asObservable().subscribe(msg => {
      this.handleMessage(msg);
    }));
    this.measurementsService.init();
    await this.userService.init();
  }

  destroy() {
    super.destroy();
    this.sideBarService.destroy();
    this.measurementsService.destroy();
    this.userService.destroy();
  }

  get measurementsList() {
    return this.measurementsService.measurementsList;
  }

  get usersList() {
    return this.userService.userList;
  }

  get stats() {
    return this.sidebarStatsService.stats;
  }

  get pieChartPreparedData() {
    return this.sideBarService.pieChartPreparedData;
  }

  get timeSeriesRawData() {
    return this.sideBarService.timeSeriesRawData;
  }

  private handleMessage(msg: SideBarMessage) {
    switch (msg.action) {
      case 'show':
        this.show(msg.message, msg.data);
        break;
      case 'close':
        break;
      case 'draw':
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown sidebarMessage action: ${msg.action}`);
    }
  }

  private async show(menuId: string, {features, coordinate}: { [name: string]: any }) {
    switch (menuId) {
      case 'eow-dataPoint-information':
        console.log(`sidebar - show ${menuId}`);
        // this.sidebarStatsService.calculateStats(features);
        await this.showStats(features);
        // PieChart.drawD3(preparedFeatures, 'pieChart', 8);
        // await this.popup.draw(features, coordinate, 'eow-dataPoint-information');
        // this.showHideMenu('measurements', hide);
        // this.showHideMenu('users', hide);
        // this.showHideMenu('eow-dataPoint-information', show);
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown menId to show: ${menuId}`);
    }
  }

  private async showStats(features: Feature[]) {
    const element = this.htmlDocument.querySelector(this.parentSelector);  // this.popup.getElement();
    const content = element.querySelector('.content');
    const stats = element.querySelector('.stats');
    content.innerHTML = '';
    element.classList.remove('active');

    if (features.length) {
      content.innerHTML = features.map(f => this.printDetails(f)).join('');
      // stats.innerHTML = PieChart.fixForThisPieChart(printStats(calculateStats(features), this.userStore));
      element.classList.add('active');
      // this._stats = this.statsService.calculateStats(features);  // stats comes direct from StatsSidebarService
      this._pieChartPreparedData = await EowDataStruct.preparePieChartData(features);
      // const preparedFeatures = await EowDataStruct.preparePieChartData(features);
      // PieChart.drawD3(preparedFeatures, '.pieChart', 8);
    }

    this.setupEventHandlers(this.parentSelector);
  }

  private setupEventHandlers(elementSelector) {
    // Popup dialog close button
    this.htmlDocument.querySelector(elementSelector).addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement);
      if (element.matches('.close')) {
        console.log(`close`);
        this.sideBarMessagingService.next({action: 'close', message: 'eow-dataPoint-information'});
        // send message to sidebar to close and reopen
      }
    });

    const moreInfoButton = this.htmlDocument.querySelectorAll('.more-info-btn');
    moreInfoButton.forEach(mib => {
      mib.addEventListener('click', (event: Event) => {
        const popupElement = mib.closest('.popup-item');
        popupElement.classList.toggle('active');
      });
    });
  }

  private printDetails(feature) {
    const properties = feature.getProperties();
    const details = this.buildDetails(properties);
    return `
      <div class="popup-item">
        <div class="metadata-row">
          <div class="image">
            <img src="${properties.image}" />
          </div>
          <div class="metadata">
            <div class="fu-preview"  style="background:${colors[properties.fu_value]}"></div>
            <div class="more-info-btn"></div>
            <div class="thead"> FU value: ${properties.fu_value}</div>
            <div class="thead"> Date: ${formatDate(properties.date_photo)}</div>
            <div class="thead"> Device:  ${properties.device_model}</div>
          </div>
        </div>
        <div class="raw-details">${details}</div>
      </div>
    `;
  }

  private buildDetails(properties) {
    return `<table>
              <tr><td class="thead">Lon, Lat</td><td colspan="5">${properties.lng}, ${properties.lat}</td></tr>
              <tr><td class="thead">Device</td><td>${formatNull(properties.device_platform)}</td>
                  <td class="thead">Model</td><td>${formatNull(properties.device_model)}</td></tr>
              <tr><td class="thead">Viewing angle</td><td>${formatNull(properties.viewing_angle)}</td>
                  <td class="thead">Cloud cover</td><td colspan="1">${formatNull(properties.p_cloud_cover)}</td></tr>
              <tr><td class="thead">FU Value</td><td colspan="1">${formatNull(properties.fu_value)}</td>
                    <td class="thead">Raining?</td><td>${formatNull(properties.rain)}</td></tr>
              <tr><td class="thead">FU Observed</td><td colspan="1">${formatNull(properties.fu_observed)}</td>
                    <td class="thead">See bottom?</td><td>${formatNull(properties.bottom)}</td></tr>
              <tr><td class="thead">FU Processed</td><td colspan="1">${formatNull(properties.fu_processed)}</td>
                     <td class="thead">Sechi depth</td><td colspan="1">${formatNull(properties.sd_depth)}</td></tr>
              <tr><td class="thead">PH</td><td colspan="1">${formatNull(properties.p_ph)}</td>
                  <td class="thead">Conductivity</td><td colspan="1">${formatNull(properties.p_conductivity)}</td></tr>
        </table>`;
  }
}

const formatDate = (d) => {
  return moment(d).format('MM/DD/YYYY hh:mm Z');
};

const formatNull = (d) => {
  return d ? d : '';
};

