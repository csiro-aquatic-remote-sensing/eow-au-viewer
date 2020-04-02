import {Component, Inject, Input, OnChanges} from '@angular/core';
import {Stats, StatsItemAmount} from './stats.base.service';
import {PieChart} from '../charts/pie-chart';
import {DOCUMENT} from '@angular/common';
import {PieItem} from '../eow-data-struct';
import {TimeSeriesChartHTML} from '../charts/time-series-chart-html';
import Feature from 'ol/Feature';
import Brolog from 'brolog';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnChanges { // extends EowBaseService implements OnInit {
  @Input() stats: Stats;
  @Input() pieChartPreparedData: PieItem[]; // Todo - move to raw Feature[]
  @Input() timeSeriesRawData: Feature[];
  @Input() location: string;

  /**
   * The parent descendant element selector of the <span class="pieChart"> that the pie chart is drawn in to
   */
  @Input() pieChartParentSelector: string;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private log: Brolog) { // TODO - I DON'T NEED TO PASS LOG AROUND
  }

  ngOnChanges() {
    this.setupEventHandlers();
    if (this.pieChartPreparedData) {
      PieChart.drawD3(this.pieChartPreparedData, this.pieChartParentSelector + ' span.pieChart', 8);
    }
    if (this.timeSeriesRawData) {
      // I DON"T LIKE THIS HERE AS UNRELATED OR MOVE 'eow-timeline' to the .html
      new TimeSeriesChartHTML(this.htmlDocument, this.timeSeriesRawData, this.log).draw('eow-timeline');
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
