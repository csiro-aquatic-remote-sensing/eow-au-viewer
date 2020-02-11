import Overlay from 'ol/Overlay';
import {
  printStats,
  calculateStats,
} from './utils';
import colors from './colors.json';
import OverlayPositioning from 'ol/OverlayPositioning';
import {EOWMap} from './eow-map';
import {PieChart} from './charts/pie-chart';
import {EowDataStruct} from './eow-data-struct';
import moment = require('moment');

export class Popup {
  elementId = 'popup';
  popup: any;
  htmlDocument: Document;
  userStore: any;
  pieChart: PieChart;

  constructor(htmlDocument: Document, userStore: any) {
    this.htmlDocument = htmlDocument;
    this.userStore = userStore;
  }

  /**
   * Create the map overlay.
   * @param elementId to draw into
   */
  init(eowMap: EOWMap) {
    if (!this.popup) {
      eowMap.mapObs.asObservable().subscribe(map => {
        this.popup = new Overlay({
          element: this.htmlDocument.getElementById(this.elementId),
          position: [0, 0],
          autoPan: true,
          autoPanMargin: 275,
          positioning: OverlayPositioning.CENTER_LEFT
        });
        map.addOverlay(this.popup);
        this.setupEventHandlers();
      });
    }
  }

  private setupEventHandlers() {
    // Popup dialog close button
    this.htmlDocument.getElementById(this.elementId).addEventListener('click', (event: Event) => {
      const element = (event.target as HTMLElement);
      if (element.matches('.close')) {
        this.popup.setVisible(false);
        this.popup.getElement().classList.remove('active');
      } else if (element.matches('.more-info-btn')) {
        const popupElement = element.closest('.popup-item');
        popupElement.classList.toggle('active');
      }
    });
  }

  getOverlay(): Overlay {
    if (!this.popup) {
      throw new Error('Popup / getOverlay - popup is null - it has not been initialised.');
    }

    return this.popup;
  }

  setVisible(visible: boolean) {
    this.popup.setVisible(visible);
  }

  draw(features: any, coordinate: any) {
    const element = this.popup.getElement();
    const content = element.querySelector('.content');
    const stats = element.querySelector('.stats');
    content.innerHTML = '';
    element.classList.remove('active');

    if (features.length) {
      content.innerHTML = features.map(f => this.printDetails(f)).join('');
      stats.innerHTML = this.pieChart.fixForThisPieChart(printStats(calculateStats(features), this.userStore));
      element.classList.add('active');
      this.popup.setPosition(coordinate); // [28468637.79432749, 5368841.526355445]);  //
      this.popup.setVisible(true);
      const preparedFeatures = EowDataStruct.preparePieChartData(features);
      PieChart.drawD3(preparedFeatures, 'pieChart', 8);
    } else {
      this.popup.setVisible(false);
    }
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
