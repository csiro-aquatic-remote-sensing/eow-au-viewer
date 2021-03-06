import {Component, Inject, Input, OnChanges, OnInit} from '@angular/core';
import Feature from 'ol/Feature';
import moment = require('moment-timezone/moment-timezone');
import colors from '../../colors.json';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {DOCUMENT} from '@angular/common';

interface EowDataComponentFormat {
  image: string;
  fu_preview: string | SafeStyle;
  fu: number;
  date: string;
  device: string;
  lng: string;
  lat: string;
  device_platform: string;
  device_model: string;
  viewing_angle: number;
  p_cloud_cover: string;
  fu_value: string;
  rain: boolean;
  fu_observed: string;
  bottom: boolean;
  fu_processed: number;
  sd_depth: number;
  p_ph: number;
  p_conductivity: number;
}

@Component({
  selector: 'app-eow-data',
  templateUrl: './eow-data.component.html',
  styleUrls: ['./eow-data.component.css']
})
export class EowDataComponent implements OnInit, OnChanges {
  @Input() features: Feature[];
  private _preparedFeatures: EowDataComponentFormat[];

  constructor(private sanitizer: DomSanitizer, @Inject(DOCUMENT) private htmlDocument: Document) {
  }

  get preparedFeatures(): EowDataComponentFormat[] {
    return this._preparedFeatures;
  }

  ngOnInit() {
    this.setupEventHandlers();
  }

  ngOnChanges() {
    this.buildPreparedFeatures();
    // setTimeout(() => this.setupEventHandlers(), 1000);
  }

  moreInfoButtonClick(event) {
    console.log('more info button click');
    const popupElement = event.closest('.popup-item');
    popupElement.classList.toggle('active');
  }

  private setupEventHandlers() {
  }

  private buildPreparedFeatures() {
    if (this.features) {
      this._preparedFeatures = this.features.map(feature => {
        const properties = feature.getProperties();
        return {
          image: properties.image,
          fu_preview: colors[properties.fu_value],
          fu: properties.fu_value,
          date: this.formatDate(properties.date_photo),
          device: properties.device_model,
          lng: properties.lng,
          lat: properties.lat,
          device_platform: this.formatNull(properties.device_platform),
          device_model: this.formatNull(properties.device_model),
          viewing_angle: this.formatNull(properties.viewing_angle),
          p_cloud_cover: this.formatNull(properties.p_cloud_cover),
          fu_value: this.formatNull(properties.fu_value),
          rain: this.formatNull(properties.rain),
          fu_observed: this.formatNull(properties.fu_observed),
          bottom: this.formatNull(properties.bottom),
          fu_processed: this.formatNull(properties.fu_processed),
          sd_depth: this.formatNull(properties.sd_depth),
          p_ph: this.formatNull(properties.p_ph),
          p_conductivity: this.formatNull(properties.p_conductivity)
        };
      });
    }
  }

  formatDate(d) {
    return moment(d).format('DD/MM/YYYY hh:mm Z');
  }

  formatNull(d) {
    return d ? d : '';
  }

  getImage(feature: EowDataComponentFormat): string {
    if (feature && feature.image) {
      return feature.image.replace(/.*?eyeonwater_upload\//, '');
    } else {
      return 'no image available';
    }
  }
}
