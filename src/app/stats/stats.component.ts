import {AfterViewInit, Component, Inject, Input, OnChanges, OnInit} from '@angular/core';
import {EowBaseService} from '../eow-base-service';
import {Stats, StatsItemAmount, StatsService} from './stats.service';
import {PieChart} from '../charts/pie-chart';
import {DOCUMENT} from '@angular/common';
import {PieItem} from '../eow-data-struct';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnChanges { // extends EowBaseService implements OnInit {
  @Input() stats: Stats;
  @Input() pieChartPreparedData: PieItem[];
  /**
   * The parent descendant element selector of the <span class="pieChart"> that the pie chart is drawn in to
   */
  @Input() pieChartParentSelector: string;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document) { // private statsService: StatsService) {
  //   super();
  }

  ngOnChanges() {
  //   this.setupEventHandlers();  // this.measurementStore);
    if (this.pieChartPreparedData) {
      PieChart.drawD3(this.pieChartPreparedData, this.pieChartParentSelector + ' span.pieChart', 8);
    }
  }

  // setupEventHandlers() { // measurementStore: MeasurementStore) {
  //   this.subscriptions.push(this.statsService.statsObs.subscribe(stats => {
  //     this.stats = stats;
  //   }));
  // }

  getStatsItemAmountItem(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? statsItemAmount.item : '';
  }

  getStatsItemAmountAmount(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? '@' + statsItemAmount.amount : 'N/A';
  }
}
