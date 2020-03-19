import {
  printStats,
  calculateStats,
} from '../utils';
import colors from '../colors.json';
import {PieChart} from '../charts/pie-chart';
import {EowDataStruct} from '../eow-data-struct';
import moment = require('moment');
import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {UserStore} from './user-store';
import {EowBaseService} from '../eow-base-service';
import {Subject} from 'rxjs';
import {SideBarMessage} from '../types';

@Injectable()
export class Popup extends EowBaseService {
  elementId = 'popup';
  popup: any;
  pieChart: PieChart;
  sideBarMessagingService: Subject<SideBarMessage>

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private userStore: UserStore) { // }, private eowMap: EOWMap) {
    super();
  }

  destroy() {
    super.destroy();
  }

  /**
   * Create the map overlay.
   * @param elementId to draw into
   */
  init(sideBarMessagingService: Subject<SideBarMessage>) { // eowMap: EOWMap) {
    this.sideBarMessagingService = sideBarMessagingService;
  }

  private setupEventHandlers(elementId) {
    // Popup dialog close button
    this.htmlDocument.getElementById(elementId).addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement);
      if (element.matches('.close')) {
        console.log(`close`);
        this.sideBarMessagingService.next({action: 'close', message: 'eow-dataPoint-information'});
        // send message to sidebar to close and reopen
      } else if (element.matches('.more-info-btn')) {
        const popupElement = element.closest('.popup-item');
        popupElement.classList.toggle('active');
      }
    });
  }

  // Draw the popup at element using data from features at the given coordinate clickec on
  async draw(features: any, coordinate: any, elementId: string) {
    const element = this.htmlDocument.getElementById(elementId);  // this.popup.getElement();
    const content = element.querySelector('.content');
    const stats = element.querySelector('.stats');
    content.innerHTML = '';
    element.classList.remove('active');

    if (features.length) {
      content.innerHTML = features.map(f => this.printDetails(f)).join('');
      stats.innerHTML = PieChart.fixForThisPieChart(printStats(calculateStats(features), this.userStore));
      element.classList.add('active');
      const preparedFeatures = await EowDataStruct.preparePieChartData(features);
      PieChart.drawD3(preparedFeatures, 'pieChart', 8);
    }

    this.setupEventHandlers(elementId);
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
            <div> FU value: ${properties.fu_value}</div>
            <div> Date: ${formatDate(properties.date_photo)}</div>
            <div> Device:  ${properties.device_model}</div>
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
                  <td class="thead">Raining?</td><td>${formatNull(properties.rain)}</td>
                  <td class="thead">See bottom?</td><td>${formatNull(properties.bottom)}</td></tr>
              <tr><td class="thead">FU Value</td><td colspan="1">${formatNull(properties.fu_value)}</td>
                  <td class="thead">Observed</td><td colspan="1">${formatNull(properties.fu_observed)}</td>
                  <td class="thead">Processed</td><td colspan="1">${formatNull(properties.fu_processed)}</td></tr>
              <tr><td class="thead">PH</td><td colspan="1">${formatNull(properties.p_ph)}</td>
                  <td class="thead">Conductivity</td><td colspan="1">${formatNull(properties.p_conductivity)}</td></tr>
              <tr><td class="thead">Cloud cover</td><td colspan="1">${formatNull(properties.p_cloud_cover)}</td>
                  <td class="thead">Sechi depth</td><td colspan="1">${formatNull(properties.sd_depth)}</td></tr>
        </table>`;
  }
}

const formatDate = (d) => {
  return moment(d).format('MM/DD/YYYY hh:mm Z');
};

const formatNull = (d) => {
  return d ? d : '';
};
