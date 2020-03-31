import {Component, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {EowBaseService} from '../../eow-base-service';
import {DOCUMENT} from '@angular/common';
import Brolog from 'brolog';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';

import {EowDataLayer} from '../../eow-data-layer';
import VectorLayer from 'ol/layer/Vector';
import {UserService, UserType} from './user.service';
import {MeasurementsService} from '../measurements/measurements.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent extends EowBaseService implements OnInit, OnDestroy {
  @Input() usersList: UserType[];
  @Output()

  // private users: [];
  // private userById: {};
  private selectedUserId = '';
  // private dataLayer: VectorLayer;
  // private usersList: [];

  constructor(private userService: UserService, private measurementsService: MeasurementsService, @Inject(DOCUMENT) private htmlDocument: Document, private log: Brolog,
              private eowDataLayer: EowDataLayer) {
    super();
  }

  ngOnInit() {
    this.setupEventHandlers();
//     const USER_SERVICE = 'https://www.eyeonwater.org/api/users';
//
//     this.subscriptions.push(this.eowDataLayer.dataLayerObs.subscribe(dataLayer => {
//       this.dataLayer = dataLayer;
//     }));
//
//     async function loadUsers() {
//       const response = await window.fetch(USER_SERVICE);
//       const {
//         results: {
//           users
//         }
//       } = await response.json();
//       return users;
//     }
//
// // Load users
//     return new Promise((resolve) => {
//       loadUsers().then((users) => {
//         this.users = users;
//         this.userById = keyBy(this.users, 'id');
//         this.renderUsers(this.users);
//         this.log.silly(this.constructor.name, `Users Loaded - ids: ${JSON.stringify(Object.keys(this.userById))}`);
//         this.setupEventHandlers();  // this.measurementStore);
//         resolve();
//       });
//     });
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
        this.selectedUserId = selectedUserId;
        element.classList.add('selectedUser', 'box-shadow');
        this.toggleFilterButton(true);
      }
    }, true);
  }

  getUsersLength() {
    return this.usersList ? this.usersList.length : 0;
  }

  // getUserById(userId) {
  //   return this.userById[userId] || {};
  // }

  clearSelectedUser() {
    this.selectedUserId = '';
    this.htmlDocument.querySelectorAll('.user-list .item').forEach(item => {
      item.classList.remove('selectedUser', 'box-shadow');
    });
  }

  renderUsers(users, n = 10) {
    // Atleast temporarily filter so only users with photos show
    this.usersList = orderBy(users, ['photo_count', 'points'], ['desc', 'desc']).slice(0, n)
      .filter(user => this.userService.getUserById(user.id).photos.length > 0); // user => user.photo_count && user.photo_count > 0)
      // .map(user => {
      //   this.log.silly(this.constructor.name, `renderUsers - add user ${user.id}, ${user.nickname}`);
      //   return `
      //       <li class="item" data-user="${user.id}">
      //         <div>
      //           <img  class="icon-thumb" src="https://eyeonwater.org/grfx/${user.icon}">
      //         </div>
      //         <div>
      //           <div class="item-nickname">${user.nickname}</div>
      //           <div class="item-photo-count">(${user.photo_count} photos)</div>
      //           <div class="item-points">${user.points} points (level ${user.level})</div>
      //         </div>
      //       </li>`;
      // });

    // if (userList.length > 0) {
    //   const results = userList.join('\n')
    //     + `<br/>There are ${users.length - userList.length} other users that have no photos to display.`;
    //   this.htmlDocument.querySelector('.user-list ul').innerHTML = results;
    // } else {
    //   this.htmlDocument.querySelector('.user-list ul').innerHTML =
    //     `There are no users with photos<br/>(There are ${users.length} in total).`;
    // }
  }

  // userExists(userId) {
  //   return Object.keys(this.getUserById(userId)).length > 0;
  // }

  private toggleFilterButton(state = false) {
    const element = this.htmlDocument.getElementById('clearFilterButton');
    element.classList.toggle('hidden', !state);
  }
}
