import {Component, Inject, Input, OnInit} from '@angular/core';
import SideBarService from './sidebar.service';
import {EowBaseService} from '../eow-base-service';
import {SideBarMessage} from '../types';
import Brolog from 'brolog';
import {Subject} from 'rxjs';
import {EowDataStruct, PieItem} from '../eow-data-struct';
import Feature from 'ol/Feature';
import {DOCUMENT} from '@angular/common';
import colors from '../colors.json';
import moment = require('moment-timezone/moment-timezone');
import {MeasurementsService} from './measurements/measurements.service';
import {UserService} from './users/user.service';
import {SidebarStatsService} from '../stats/stats.sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent extends EowBaseService implements OnInit {
  constructor(private sideBarService: SideBarService, private measurementsService: MeasurementsService, private userService: UserService,
              private sidebarStatsService: SidebarStatsService, @Inject(DOCUMENT) private htmlDocument: Document, private log: Brolog) {
    super();
  }

  async ngOnInit() {
    this.measurementsService.init();
    await this.userService.init();
  }

  destroy() {
    super.destroy();
    this.sideBarService.destroy();
    this.measurementsService.destroy();
    this.userService.destroy();
  }

  get measurementsList() {
    return this.measurementsService.measurementsList;
  }

  get usersList() {
    return this.userService.userList;
  }

  get stats() {
    return this.sidebarStatsService.stats;
  }

  get pieChartPreparedData() {
    return this.sideBarService.pieChartPreparedData;
  }

  get timeSeriesRawData() {
    return this.sideBarService.timeSeriesRawData;
  }
}

