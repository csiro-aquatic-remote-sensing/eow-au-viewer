import {Injectable} from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import orderBy from 'lodash/orderBy';
import keyBy from 'lodash/keyBy';

import {EowBaseService} from '../../eow-base-service';
import {EowDataLayer} from '../../eow-data-layer';
import Brolog from 'brolog';
import {LoginResponse, LoginService} from '../../header/login/login.service';

export interface UserType {
  id: number;
  nickname: string;
  icon: string;
  photo_count: number;
  level: number;
  points: number;
  sourcedFromLoginRequest: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends EowBaseService {
  private users: UserType[];
  private userById: {};
  private dataLayer: VectorLayer;
  private _usersList: UserType[] = [];

  constructor(private eowDataLayer: EowDataLayer, private loginService: LoginService, private log: Brolog) {
    super();
  }

  async init() {
    const USER_SERVICE = 'https://www.eyeonwater.org/api/users';

    this.subscriptions.push(this.eowDataLayer.dataLayerObs.subscribe(dataLayer => {
      this.dataLayer = dataLayer;
    }));

    this.subscriptions.push(this.loginService.loginResponseObs.subscribe(loginResponse => {
      this.buildUsersList(this.users, {loginResponse});
    }));

    async function loadUsers() {
      const response = await window.fetch(USER_SERVICE);
      const {
        results: {
          users
        }
      } = await response.json();
      return users;
    }

// Load users
    return new Promise((resolve, reject) => {
      loadUsers().then((users) => {
        this.users = users;
        this.userById = keyBy(this.users, 'id');
        this.buildUsersList(this.users);
        this.log.silly(this.constructor.name, `Users Loaded - ids: ${JSON.stringify(Object.keys(this.userById))}`);
        // this.setupEventHandlers();  // this.measurementStore);
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  buildUsersList(users, {n = 10, loginResponse = null}: {n?: number, loginResponse?: LoginResponse} = {}) {
    // Atleast temporarily filter so only users with photos show
    if (users) {
      this._usersList = orderBy(users, ['photo_count', 'points'], ['desc', 'desc']).slice(0, n)
        .filter(user => this.getUserById(user.id).photos.length > 0); // user => user.photo_count && user.photo_count > 0)

      if (loginResponse) {
        const loggedInUser = users.filter(u => u.nickname === loginResponse.profile.nickname);
        if (loggedInUser.length) {
          loggedInUser[0].sourcedFromLoginRequest = true;
          this._usersList.unshift(loggedInUser[0]);
        } else {
          this.log.error(`Logged in as ${loginResponse.profile.nickname}, but no such users in userList`);
        }
      }
      console.log(`usersList: ${this._usersList}`);
    }
  }

  get userList() {
    return this._usersList;
  }

  getUserById(userId) {
    return this.userById[userId] || {};
  }

  getUserByIdKeys() {
    return Object.keys(this.userById);
  }

  userExists(userId) {
    return Object.keys(this.getUserById(userId)).length > 0;
  }
}
