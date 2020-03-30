import {Component, OnDestroy, OnInit} from '@angular/core';
import {EowBaseService} from '../eow-base-service';
import {Stats, StatsItemAmount, StatsService} from '../stats/stats.service';
import {BehaviorSubject} from 'rxjs';
import {EowDataLayer} from '../eow-data-layer';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends EowBaseService implements OnInit, OnDestroy {
  // private _statsObs: BehaviorSubject<Stats> = new BehaviorSubject<Stats>(new Stats());  // Observers that outside subscribers can use to know when data ready
  stats: Stats;

  constructor(private eowDataLayer: EowDataLayer, private statsService: StatsService) {
    super();
    this.stats = new Stats();
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
    this.subscriptions.push(this.eowDataLayer.allDataSourceObs.subscribe(allDataSource => {
      if (allDataSource) {
        // @ts-ignore
        // this.dataLayer.on('change', debounce(({target}) => {
        this.stats = this.statsService.calculateStats(allDataSource.getFeatures());
        // }));
      }
    }));
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
