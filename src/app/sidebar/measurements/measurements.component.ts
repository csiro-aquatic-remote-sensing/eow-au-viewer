import { Component, OnInit, OnDestroy, Inject, Input } from '@angular/core';
import Brolog from 'brolog';
import { DOCUMENT } from '@angular/common';
import {MeasurementsService, MeasurementsType} from './measurements.service';
import VectorSource from 'ol/source/Vector';
import Map from 'ol/Map';
import { Feature } from 'ol';
import { AnimationOptions } from 'ol/View';
import {Coordinate} from 'ol/coordinate';
import { EowBaseService } from 'src/app/eow-base-service';
import { EowDataLayer } from 'src/app/eow-data-layer';
import { EOWMap } from 'src/app/eow-map';

@Component({
  selector: 'app-measurements',
  templateUrl: './measurements.component.html',
  styleUrls: ['./measurements.component.css']
})
export class MeasurementsComponent extends EowBaseService implements OnInit, OnDestroy {
  @Input() measurementsList: MeasurementsType[];
  private map: Map;

  constructor(private measurementsService: MeasurementsService, private eowMap: EOWMap,
              private log: Brolog, @Inject(DOCUMENT) private htmlDocument: Document) {
    super();
  }

  ngOnDestroy() {
    super.destroy();
  }

  ngOnInit() {
    this.subscriptions.push(this.eowMap.getMap().subscribe(map => {
      this.map = map;
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
      this.measurementsService.resetMeasurements();
    });
  }

  getMeasurementsListlength() {
    return this.measurementsList ? this.measurementsList.length : 0;
  }

  private showMeasurements(userMeasurments: Feature[]) {
    const newSource = new VectorSource();
    newSource.addFeatures(userMeasurments);
    // this.showMeasurements(newSource);
    if (this.measurementsService.dataLayer) {
      this.measurementsService.dataLayer.setSource(newSource);
    }
    this.map.getView().fit(newSource.getExtent(), {
      size: this.map.getSize(),
      padding: [100, 100, 100, 100],
      nearest: false,
      duration: 1300
    });
  }
}
