import {Component, OnDestroy, OnInit} from '@angular/core';
import {EowBaseService} from '../eow-base-service';
import {Stats, StatsItemAmount} from '../stats/stats.base.service';
import {BehaviorSubject} from 'rxjs';
import {EowDataLayer} from '../eow-data-layer';
import {HeaderStatsService} from '../stats/stats.header.service';
import {MeasurementsComponent} from '../sidebar/measurements/measurements.component';
import {MeasurementsService} from '../sidebar/measurements/measurements.service';
import VectorSource from 'ol/source/Vector';
import {EOWMap} from '../eow-map';
import Map from 'ol/Map';
import Feature from 'ol/Feature';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends EowBaseService implements OnInit, OnDestroy {
  eowDataSource: VectorSource;
  map: Map;

  constructor(private headerStatsService: HeaderStatsService, private measurementsService: MeasurementsService,
              private eowDataLayer: EowDataLayer, private eowMap: EOWMap) {
    super();
  }

  ngOnDestroy() {
    super.destroy();
  }

  ngOnInit() {
    this.setupEventHandlers();  // this.measurementStore);
  }

  setupEventHandlers() { // measurementStore: MeasurementStore) {
    this.subscriptions.push(this.eowDataLayer.allDataSourceObs.subscribe(eowDataSource => {
      this.eowDataSource = eowDataSource;
    }));
    this.subscriptions.push(this.eowMap.getMap().subscribe(map => {
      this.map = map;
    }));
  }

  get stats() {
    const measurementsInView = this.getMeasurementsInView();
    this.headerStatsService.calculateStats(measurementsInView);
    return this.headerStatsService.stats;
  }

  private getMeasurementsInView(): Feature[] {
    if (this.map && this.eowDataSource) {
      const eowDataPointsInView = this.eowDataSource.getFeaturesInExtent(this.map.getView().calculateExtent(this.map.getSize()));
      return eowDataPointsInView;
    }
  }

  onLogin() {
    console.log('header login');
  }
}
