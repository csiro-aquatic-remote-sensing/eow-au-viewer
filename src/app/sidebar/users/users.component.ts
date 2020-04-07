import {Component, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {EowBaseService} from '../../eow-base-service';
import {DOCUMENT} from '@angular/common';
import Brolog from 'brolog';
import orderBy from 'lodash/orderBy';

import {EowDataLayer} from '../../eow-data-layer';
import {UserService, UserType} from './user.service';
import {MeasurementsService} from '../measurements/measurements.service';
import VectorLayer from 'ol/layer/Vector';
import {EOWMap} from '../../eow-map';
import Map from 'ol/Map';
import {BehaviorSubject} from 'rxjs';
import VectorSource from 'ol/source/Vector';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent extends EowBaseService implements OnInit, OnDestroy {
  @Input() usersList: UserType[];
  private dataLayer: VectorLayer;
  private allDataSource: VectorSource;
  private map: Map;
  private selectedUserId = '';

  constructor(private userService: UserService, private measurementsService: MeasurementsService, @Inject(DOCUMENT) private htmlDocument: Document,
              private eowData: EowDataLayer, private eowMap: EOWMap) {
    super();
  }

  ngOnInit() {
    this.subscriptions.push(this.eowData.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));

    this.subscriptions.push(this.eowMap.getMap().subscribe(async map => {
      this.map = map;
    }));

    this.subscriptions.push(this.eowData.allDataSourceObs.subscribe(allDataSource => {
      if (allDataSource) {
        this.allDataSource = allDataSource;
      }
    }));

    this.setupEventHandlers();
  }

  ngOnDestroy() {
    super.destroy();
  }

  setupEventHandlers() {
    this.htmlDocument.querySelector('.user-list').addEventListener('click', (event) => {
      this.clearSelectedUser();
      const element = (event.target as HTMLElement).closest('.item');
      const selectedUserId = element.getAttribute('data-user');
      // console.log(`clicked on user-id: ${this.userStore.selectedUserId}`);
      if (this.measurementsService.showUserMeasurements(selectedUserId)) {
        console.log(`Clicked on user has measurements`);
      } else {
        console.log(`Clicked on user HASN'T measurements`);
      }
      this.selectedUserId = selectedUserId;
      element.classList.add('selectedUser', 'box-shadow');
      this.toggleFilterButton(true);
    }, true);

    this.htmlDocument.getElementById('clearFilterButton').addEventListener('click', (event) => {
      this.clearFilter();
    });

  }

  getUsersLength() {
    return this.usersList ? this.usersList.length : 0;
  }

  clearSelectedUser() {
    this.selectedUserId = '';
    this.htmlDocument.querySelectorAll('.user-list .item').forEach(item => {
      item.classList.remove('selectedUser', 'box-shadow');
    });
    this.measurementsService.resetMeasurements();
  }

  buildClasses(user: UserType) {
    let classes = 'item';
    if (user.sourcedFromLoginRequest) {
      classes += ' loggedInUser';
    }
    return classes;
  }

  private toggleFilterButton(state = false) {
    const element = this.htmlDocument.getElementById('clearFilterButton');
    element.classList.toggle('hidden', !state);
  }

  private clearFilter() {
    // this.userStore.clearSelectedUser();
    // this.measurementStore.clearFilter();
    if (this.dataLayer && this.allDataSource) {
      this.map.getView().fit(this.dataLayer.getSource().getExtent(), {duration: 1300});
      if (this.allDataSource) {
        this.dataLayer.setSource(this.allDataSource);
      }
    }
    this.toggleFilterButton(false);
  }

  // private toggleFilterButton(state = false) {
  //   const element = this.htmlDocument.getElementById('clearFilterButton');
  //   element.classList.toggle('hidden', !state);
  // }
}
