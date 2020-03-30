import {Component, Input, OnInit} from '@angular/core';
import {Stats, StatsService} from '../stats/stats.service';
import SideBarService from './sidebar.service';
import {EowBaseService} from '../eow-base-service';
import {SideBarMessage} from '../types';
import Brolog from 'brolog';
import {Subject} from 'rxjs';
import {PieChart} from '../charts/pie-chart';
import {EowDataStruct, PieItem} from '../eow-data-struct';
import Feature from 'ol/Feature';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent extends EowBaseService implements OnInit {
  @Input() sideBarMessagingService: Subject<SideBarMessage>;
  stats: Stats;
  pieChartPreparedData: PieItem[];
  pieChartParentSelector = 'div#eow-dataPoint-information';

  constructor(private sideBarService: SideBarService, private statsService: StatsService, private log: Brolog) {
    super();
    this.stats = new Stats();
  }

  destroy() {
    super.destroy();
  }

  async ngOnInit() {
    this.subscriptions.push(this.sideBarMessagingService.asObservable().subscribe(msg => {
      this.handleMessage(msg);
    }));

  }

  private handleMessage(msg: SideBarMessage) {
    switch (msg.action) {
      case 'show':
        this.show(msg.message, msg.data);
        break;
      case 'close':
        break;
      case 'draw':
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown sidebarMessage action: ${msg.action}`);
    }
  }

  private async show(menuId: string, {features, coordinate}: { [name: string]: any }) {
    switch (menuId) {
      case 'eow-dataPoint-information':
        console.log(`sidebar - show ${menuId}`);
        await this.showStats(features);
        // PieChart.drawD3(preparedFeatures, 'pieChart', 8);
        // await this.popup.draw(features, coordinate, 'eow-dataPoint-information');
        // this.showHideMenu('measurements', hide);
        // this.showHideMenu('users', hide);
        // this.showHideMenu('eow-dataPoint-information', show);
        break;
      default:
        this.log.warn(this.constructor.name, `Unknown menId to show: ${menuId}`);
    }
  }

  private async showStats(features: Feature[]) {
    this.stats = this.statsService.calculateStats(features);
    this.pieChartPreparedData = await EowDataStruct.preparePieChartData(features);
  }
}
