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
  // private _statsObs: BehaviorSubject<Stats> = new BehaviorSubject<Stats>(new Stats());  // Observers that outside subscribers can use to know when data ready
  // stats: Stats;

  constructor(private headerStatsService: HeaderStatsService, private measurementsService: MeasurementsService) {
    super();
    // this.stats = new Stats();
  }

  ngOnDestroy() {
    super.destroy();
  }

//   private stats: Stats;
//
//   constructor(private statsService: StatsService) {
//     super();
//   }
//
  ngOnInit() {
    this.setupEventHandlers();  // this.measurementStore);
  }

  setupEventHandlers() { // measurementStore: MeasurementStore) {
    // this.subscriptions.push(this.eowDataLayer.allDataSourceObs.subscribe(allDataSource => {
    //   if (allDataSource) {
        // @ts-ignore
        // this.dataLayer.on('change', debounce(({target}) => {
        // this.stats = this.statsService.calculateStats(allDataSource.getFeatures());  // TODO - no longer do it like this
        // }));
      // }
    // }));
  }

  get stats() {
    this.headerStatsService.calculateStats(this.measurementsService.measurements);
    return this.headerStatsService.stats;
  }
//
//   getStatsItemAmountItem(statsItemAmount: StatsItemAmount) {
//     return statsItemAmount.item ? statsItemAmount.item : '';
//   }
//
//   getStatsItemAmountAmount(statsItemAmount: StatsItemAmount) {
//     return statsItemAmount.item ? '@' + statsItemAmount.amount : 'N/A';
//   }
//
  onLogin() {
    console.log('header login');
  }
}
