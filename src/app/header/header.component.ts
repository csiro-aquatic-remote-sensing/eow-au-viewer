import {Component, OnInit} from '@angular/core';
import {EowBaseService} from '../eow-base-service';
import {Stats, StatsItemAmount, StatsService} from '../stats.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends EowBaseService implements OnInit {
  private stats: Stats;

  constructor(private statsService: StatsService) {
    super();
  }

  ngOnInit() {
    this.setupEventHandlers();  // this.measurementStore);
  }

  setupEventHandlers() { // measurementStore: MeasurementStore) {
    this.subscriptions.push(this.statsService.statsObs.subscribe(stats => {
      this.stats = stats;
    }));
  }

  getStatsItemAmountItem(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? statsItemAmount.item : '';
  }

  getStatsItemAmountAmount(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? '@' + statsItemAmount.amount : 'N/A';
  }

  onLogin() {
    console.log('header login');
  }
}
