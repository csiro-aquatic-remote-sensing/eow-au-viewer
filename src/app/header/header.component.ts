import {Component, OnDestroy, OnInit} from '@angular/core';
import {EowBaseService} from '../eow-base-service';
import {Stats, StatsItemAmount} from '../stats/stats.base.service';
import {BehaviorSubject} from 'rxjs';
import {EowDataLayer} from '../eow-data-layer';
import {HeaderStatsService} from '../stats/stats.header.service';
import {MeasurementsComponent} from '../sidebar/measurements/measurements.component';
import {MeasurementsService} from '../sidebar/measurements/measurements.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends EowBaseService implements OnInit, OnDestroy {

  constructor(private headerStatsService: HeaderStatsService, private measurementsService: MeasurementsService) {
    super();
  }

  ngOnDestroy() {
    super.destroy();
  }

  ngOnInit() {
    this.setupEventHandlers();  // this.measurementStore);
  }

  setupEventHandlers() { // measurementStore: MeasurementStore) {
  }

  get stats() {
    this.headerStatsService.calculateStats(this.measurementsService.measurements);
    return this.headerStatsService.stats;
  }

  onLogin() {
    console.log('header login');
  }
}
