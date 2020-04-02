import {Component, Inject, Input, OnChanges} from '@angular/core';
import {Stats, StatsItemAmount} from './stats.base.service';
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
  @Input() location: String;

  /**
   * The parent descendant element selector of the <span class="pieChart"> that the pie chart is drawn in to
   */
  @Input() pieChartParentSelector: string;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document) { // private statsService: StatsService) {
  }

  ngOnChanges() {
    this.setupEventHandlers();
    if (this.pieChartPreparedData) {
      PieChart.drawD3(this.pieChartPreparedData, this.pieChartParentSelector + ' span.pieChart', 8);
    }
  }

  setupEventHandlers() { // measurementStore: MeasurementStore) {
  }

  getStatsItemAmountItem(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? statsItemAmount.item : '';
  }

  getStatsItemAmountAmount(statsItemAmount: StatsItemAmount) {
    return statsItemAmount.item ? '@' + statsItemAmount.amount : 'N/A';
  }
}
