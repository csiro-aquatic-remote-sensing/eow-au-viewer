import {Component, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {EowBaseService} from '../../eow-base-service';
import {DOCUMENT} from '@angular/common';
import Brolog from 'brolog';
import orderBy from 'lodash/orderBy';

import {EowDataLayer} from '../../eow-data-layer';
import {UserService, UserType} from './user.service';
import {MeasurementsService} from '../measurements/measurements.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent extends EowBaseService implements OnInit, OnDestroy {
  @Input() usersList: UserType[];

  private selectedUserId = '';

  constructor(private userService: UserService, private measurementsService: MeasurementsService, @Inject(DOCUMENT) private htmlDocument: Document) {
    super();
  }

  ngOnInit() {
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
}
